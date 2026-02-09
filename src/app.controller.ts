import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  @ApiOperation({ summary: 'Check health status' })
  @ApiResponse({
    status: 200,
    description: 'Returns health status',
    type: String,
  })
  getHealth(): string {
    return this.appService.getHealth();
  }

  @Get('/')
  @ApiOperation({ summary: 'Get hello message' })
  @ApiResponse({
    status: 200,
    description: 'Returns hello message',
    type: String,
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
