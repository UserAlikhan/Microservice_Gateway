import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { timeout } from 'rxjs';

@Injectable()
export class AppService {
  constructor(
    @Inject('GATEWAY') private rabbitClient: ClientProxy
  ) {}
  getHello(): string {
    return 'Hello World!';
  }

  getCoinPrice(coinId: string) {
    return this.rabbitClient.send({ cmd: "get-coin-price" }, coinId).pipe(timeout(5000))
  }

  readFile(filename: string) {
    return this.rabbitClient.send({ cmd: "read-file" }, filename).pipe(timeout(5000))
  }

  writeFile(fileName: string, content: string) {
    this.rabbitClient.emit("write-coin-price-file", { fileName, content })
    return { message: 'File has been written!' }
  }
}
