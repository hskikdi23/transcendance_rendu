import { Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

@Module({
  controllers: [ChannelController],
  providers: [ChannelService, PrismaService, UsersService],
  exports: [ChannelService]
})
export class ChannelModule {}
