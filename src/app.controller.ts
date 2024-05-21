import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/coinPrice/:id') 
  getCoinPrice(@Param('id') coinId: string) {
    return this.appService.getCoinPrice(coinId)
  }

  @Get('read-file')
  async readFile(@Query('filename') filename: string) {
    return this.appService.readFile(filename)
  }

  @Post('write-file')
  async writeFile(
    @Body() data:{content: string},
    @Body() fileName:{fileName: string}
  ) {
    return this.appService.writeFile(fileName.fileName, data.content)
  }
}
