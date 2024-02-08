import { Injectable, StreamableFile } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs'

@Injectable()
export class ImagesService {

  constructor(private readonly prisma: PrismaService) {}

  async addImage(userId: number, file: Express.Multer.File) {
    return this.prisma.image.create({
      data: {
        path: `${file.destination}/${file.filename}`,
        userId: userId // P2003
      }
    })
  }

  async setImage(userId: number, imageId: number) {
    return this.prisma.image.update({
      where: {
        id: imageId // P2025
      },
      data: {
        lastuse: new Date()
      }
    })
  }

  async findAll(userId: number) {
    return this.prisma.image.findMany({
      where: {
        user: {
          id: userId
        }
      },
      orderBy: {
        lastuse: 'desc',
      }
    })
  }

  async getImage(userId: number) {
    const image = await this.prisma.image.findMany({
      take: 1,
      where: {
        user: {
          id: userId
        },
      },
      orderBy: {
        lastuse: 'desc',
      }
    })
    if (image[0] !== undefined) {
      const file = fs.createReadStream(image[0].path);
      return new StreamableFile(file);
    }
  }

  async findOne(userId: number, id: number) {
    const image = await this.prisma.image.findUnique({
      where: {
        id: id
      }
    })
    if (image !== null) {
      const file = fs.createReadStream(image.path);
      return new StreamableFile(file)
    }
    return null
  }

  async remove(id: number) {

    // remove from db
    const image = await this.prisma.image.delete({
      where: {
        id: id // P2025
      }
    })

    // remove from docker volume
    fs.rmSync(`${image.path}`)
  }

}
