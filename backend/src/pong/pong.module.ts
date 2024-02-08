import { Module } from '@nestjs/common';
import { PongService } from './pong.service';
import { PongGateway } from './pong.gateway';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { MatchsService } from 'src/matchs/matchs.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PongController } from './pong.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
  ],
  providers: [PongGateway, PongService, MatchsService, PrismaService],
  controllers: [PongController]
})
export class PongModule {}
