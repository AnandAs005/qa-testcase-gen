import { Controller, Post, Body } from '@nestjs/common';
import { QaService } from './qa.service';

@Controller('qa')
export class QaController {
  constructor(private readonly qaService: QaService) { }

  @Post('generate')
  async generate(@Body('type') type: string, @Body('url') url: string, @Body('useCase') useCase: string, @Body('projectName') projectName: string) {
      return this.qaService.generateTestCases(type, url, useCase, projectName);
  }
}  