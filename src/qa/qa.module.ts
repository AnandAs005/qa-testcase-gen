import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QaService } from './qa.service';
import { QaController } from './qa.controller';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [QaController],
  providers: [QaService],
})
export class QaModule {}