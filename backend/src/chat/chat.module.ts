import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { ChatGateway } from './chat.gateway';
import { ChannelModule } from 'src/channel/channel.module';
import { PostsModule } from 'src/posts/posts.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatService } from './chat.service';
import { PostsService } from 'src/posts/posts.service';
import { DirectMessageService } from './dm.service';

@Module({
  imports: [AuthModule, UsersModule, ChannelModule, PostsModule],
  providers: [ChatGateway, JwtService, PrismaService, ChatService, PostsService, DirectMessageService],
})
export class ChatModule {}
