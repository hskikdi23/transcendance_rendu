import { Module } from '@nestjs/common';
import { MatchsService } from './matchs.service';
import { MatchsController } from './matchs.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [MatchsService, PrismaService],
  controllers: [MatchsController]
})
export class MatchsModule {}
