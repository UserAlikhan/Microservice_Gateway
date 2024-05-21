import { HttpException, MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import { verify } from 'jsonwebtoken';
import { Response } from 'express';
import { ClientsModule, Transport } from '@nestjs/microservices';

const getToken = (authToken: string): string => {
  const match = authToken.match(/^Bearer (.*)$/)
  if(!match || match.length < 2) {
    throw new HttpException('Invalid Token', 404)
  }
  return match[1]
}

const decodedToken = (tokenString: string) => {
  const decoded = verify(tokenString, 'hide-me')
  if (!decoded) {
    throw new HttpException('Invalid Token', 404)
  }
  return decoded
}

const handleAuth = ({ req, res }) => {
  try {
    if (req.headers.authorization) {
      const token = getToken(req.headers.authorization)
      const decoded: any = decodedToken(token)
      return {
        userId: decoded.sub,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        authorization: `${req.headers.authorization}`,
        x_csrf_token_cookie: `${req.cookies['XSRF-TOKEN']}`,
        x_csrf_token: `${req.headers['x-csrf-token']}`,
      }
    } else {      
      return {
        x_csrf_token_cookie: `${req.cookies['XSRF-TOKEN']}`,
        x_csrf_token: `${req.headers['x-csrf-token']}`,
      }
    }
  } catch (err) {
    throw new HttpException('User unathorized', 404)
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      server: {
        // implementing jwt-token handling inside our project
        // context: handleAuth
        context: ({ req, res }) => (handleAuth({req, res})),
        playground: {
          settings: {
            'request.credentials': 'include'
          }
        }
      },
      gateway: {
        buildService: ({name, url}) => {
          return new RemoteGraphQLDataSource({
            url,
            didReceiveResponse({ response, context }) {
              // console.log('response ', response.data.getToken)
              const csrfheader = response.data.getToken
              if (csrfheader) {
                (context?.req?.res as Response)?.cookie(
                  'XSRF-TOKEN',
                  csrfheader,
                  {
                    httpOnly: true,
                    sameSite: 'none',
                    secure: true,
                    expires: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000)
                  }
                );
              }
              return response
            },
            willSendRequest({ request, context }: any) {
              request.http.headers.set('userId', context.userId);
              request.http.headers.set('authorization', context.authorization);
              request.http.headers.set('username', context.username);
              request.http.headers.set('email', context.email);
              request.http.headers.set('role', context.role);
              request.http.headers.set('x-csrf-token-cookie', context.x_csrf_token_cookie)
              request.http.headers.set('x-csrf-token', context.x_csrf_token)
            }
          })
        },
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [
            { name: 'User', url: 'http://users_microservice:3001/graphql' },
            { name: 'Drawn-Objects', url: 'http://drawn_objects_microservice:3002/graphql' },
            { name: 'Buy-Orders', url: 'http://buy_orders_microservice:3003/graphql' },
            { name: 'Assets', url: 'http://assets_microservice:3004/graphql' },
            { name: 'Backtesting', url: 'http://backtesting_microservice:3005/graphql' },
          ]
        })
      }
    }),
    ClientsModule.register([
      {
        name: 'GATEWAY',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://rabbitmq:password@rabbitmq:5672'],
          queue: 'gateway-queue',
        },
      }
    ])
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  // configure(consumer: MiddlewareConsumer) {
    // consumer
      // .apply(CSRFTokenCheckMiddleware).forRoutes('graphql')
  // }
}
