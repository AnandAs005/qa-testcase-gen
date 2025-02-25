import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { QaModule } from './qa/qa.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),  // Load .env globally
  QaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
