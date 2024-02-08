import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import * as bcrypt from 'bcrypt';
import { ChannelStatus } from '@prisma/client';

@Injectable()
export class ChannelService {

  constructor(private readonly prisma: PrismaService){}

  create(channel: CreateChannelDto) {
    return this.prisma.channel.create({
      data: {
        name: channel.channelName, // P2002
        ownerId: channel.ownerId, // P2003
        admins: { connect: { id: channel.ownerId } }, // P2025
        users: { connect: { id: channel.ownerId } }, // P2025
        status: channel.status, // checked by ValidationPipe
        password: channel.password // ??
      }
    })
  }

  findAll() {
    return this.prisma.channel.findMany({
      include: {
        owner: true,
        users: true,
        admins: true,
        posts: true,
        invited: true
      }
    });
  }

  findUserChannel(userId: number) {
    return this.prisma.channel.findMany({
      where : {
        users: {
          some: {
            id: userId
          }
        }
      }
    });
  }

  findById(channelId: number)  {
    return this.prisma.channel.findUnique({
      where: {
        id: channelId
      },
      include: {
        owner: true,
        users: true,
        admins: true,
        posts: true
      }
    });
  }

  findByName(channelName: string) {
    return this.prisma.channel.findUnique({
      where: {
        name: channelName
      },
      include: {
        owner: true,
        users: true,
        admins: true,
        posts: true
      }
    });
  }

  deleteByName(channelName: string) {
    return this.prisma.channel.delete({
      where: {
        name: channelName // P2025
      }
    })
  }

  async isInChannel(channelName: string, userId: number): Promise<boolean> {
    const channel = await this.findByName(channelName)
    return channel !== null && channel.users.some(user => user.id === userId)
  }

  async isOwner(channelName: string, userId: number): Promise<boolean> {
    const channel = await this.findByName(channelName)
    return channel !== null && channel.owner.id === userId
  }

  async isAdmin(channelName: string, userId: number): Promise<boolean> {
    const channel = await this.findByName(channelName)
    return channel !== null && channel.admins.some(admin => admin.id === userId)
  }

  async isBanned(channelName: string, userId: number): Promise<boolean> {
    const banned = await this.getBanned(channelName)
    return banned !== undefined && banned.some(user => user.id === userId)
  }

  addUserToChannel(channelName: string, userId: number) {
    return this.prisma.channel.update({
      where: {
        name: channelName // P2016
      },
      data: {
        users: {
          connect: {
            id: userId // P2025
          }
        },
        invited: {
          disconnect: {
            id: userId
          }
        }
      }
    })
  }

  async leave(channelName: string, userId: number) {

    const channel = await this.findByName(channelName)

    // if the last member leave, we delete the channel
    if (channel?.users?.length === 1)
      return this.deleteByName(channelName)

    // if the owner leave, we transfer ownership
    if (channel?.ownerId === userId) {

      // prioritize admins to be the new owner
      let newOwner = channel.admins.find(admin => admin.id !== userId)

      if (newOwner === undefined)
        newOwner = channel.users.find(user => user.id !== userId)

      // promote new owner as admin if not already
      if (channel.admins.some(admin => admin.id === newOwner?.id) === false)
        await this.promoteAdmin(channelName, newOwner?.id as number)

      // set new owner
      try {
        await this.prisma.channel.update({
          where: {
            name: channelName // P2025
          },
          data: {
            ownerId: newOwner?.id // P2003 (unless undefined)
          }
        })
      } catch(e) {
        throw new NotFoundException('channel not found')
      }

    }

    // now you can leave
    return this.removeUser(channelName, userId)
  }

  removeUser(channelName: string, userId: number) {
    return this.prisma.channel.update({
      where: {
        name: channelName // P2025
      },
      data: {
        users: {
          disconnect: {
            id: userId // doesn't throw anything
          }
        },
        admins: {
          disconnect: {
            id: userId // doesn't throw anything
          }
        }
      }
    })
  }

  banUser(channelName: string, userId: number) {
    return this.prisma.channel.update({
      where: {
        name: channelName // P2025
      },
      data: {
        banned: {
          connect: {
            id: userId // P2025
          }
        }
      }
    })
  }

  promoteAdmin(channelName: string, userId: number) {
    return this.prisma.channel.update({
      where: {
        name: channelName // P2016
      },
      data: {
        admins: {
          connect: {
            id: userId // P2025
          }
        }
      }
    })
  }

  revokeAdmin(channelName: string, userId: number) {
    return this.prisma.channel.update({
      where: {
        name: channelName // P2025
      },
      data: {
        admins: {
          disconnect: {
            id: userId // doesn't throw anything
          }
        }
      }
    })
  }

  async verifyPassword(channelName: string, password: string): Promise<boolean> {
    const channel = await this.findByName(channelName)
    if (channel === null)
      return false
    return bcrypt.compare(password, channel.password)
  }

  async getBanned(channelName: string) {
    const channel = await this.prisma.channel.findUnique({
      where: {
        name: channelName
      },
      select: {
        banned: true
      }
    })
    return channel?.banned
  }

  async updatePassword(channelName: string, password: string) {
    const channel = await this.prisma.channel.update({
      where: {
        name: channelName // P2025
      },
      data: {
        password: password
      }
    })
    return this.prisma.exclude<any,any>(channel, ['password'])
  }

  async updateStatus(channelName: string, password: string, status: ChannelStatus) {
    const channel = await this.prisma.channel.update({
      where: {
        name: channelName // P2025
      },
      data: {
        status: status,
        password: password
      }
    })
    return this.prisma.exclude<any,any>(channel, ['password'])
  }

  async inviteUser(channelName: string, userId: number) {
   const channel = await this.prisma.channel.update({
      where: {
        name: channelName // P2025
      },
      data: {
        invited: {
          connect: {
            id: userId // P2025
          }
        }
      }
    })
    return this.prisma.exclude<any,any>(channel, ['password'])
  }

}
