import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { DirectMessageService } from 'src/chat/dm.service';
import { UsersService } from 'src/users/users.service';
import { ImagesService } from 'src/images/images.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService, PrismaService, DirectMessageService, UsersService, ImagesService],
  exports: [PostsService]
})
export class PostsModule {}
