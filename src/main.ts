import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
// import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5000')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
  })

  app.enableCors({
    origin: 'http://localhost:5000',
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "X-CSRF-TOKEN",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Credentials",
      "Access-Control-Allow-Headers",
    ],
    credentials: true
  })
  // app.useGlobalPipes(new ValidationPipe())
  app.use(cookieParser())
  await app.listen(3000);
  // const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  //   AppModule,
  //   {
  //     transport: Transport.RMQ,
  //     options: {
  //       urls: ['amqp://rabbitmq:password@rabbitmq:5672'],
  //       queue: 'users-queue',
  //     },
  //   },
  // );
  // await app.listen(3000)
}
bootstrap();
