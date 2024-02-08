import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {

  constructor(private readonly prisma: PrismaService) {}

  async create(post: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        content: post.content,
        authorId: post.authorId, // P2003
        channelId: post.channelId, // P2003
      }
    });
  }

  async findAll() {
    return this.prisma.post.findMany();
  }

  async findOne(id: number) {
    return this.prisma.post.findUnique({
      where: {
        id: id,
      }
    });
  }

  async findByChannel(channelId: number) {
    return this.prisma.post.findMany({
      where: {
        channelId: channelId
      }
    });
  }

  async update(id: number, post: UpdatePostDto) {
    return this.prisma.post.update({
      where: {
        id: id, // P2025
      },
      data: {
        content: post.content,
      }
    });
  }

  async remove(id: number) {
    return this.prisma.post.delete({
      where: {
        id: id // P2025
      }
    })
  }
}
