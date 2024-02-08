import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@prisma/client';
import * as fs from 'fs'

@Injectable()
export class UsersService {

  constructor(private readonly prisma: PrismaService) {}

  async create(user: CreateUserDto) {

    // create user
    const _user: User = await this.prisma.user.create({
      data: {
        username: user.username, // P2002
        password: user.password,
        ft_login: user.ft_login,
        games:  0,
        mmr: 800,
      }
    })

    // each user with its own image directory
    fs.mkdirSync(`/app/images/${_user.id}`)

    // user created via 42 API: there is an image
    if (user.image !== null && user.image !== undefined) {

      // path for the the image
      const path: string = `/app/images/${_user.id}/default42.jpg`

      // download the image into the docker volume
      const response = await fetch(user.image.href)
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      fs.writeFileSync(path, buffer, { flag: 'wx' }) // are those flags the right ones ?

      // add image link to db
      await this.prisma.image.create({
        data: {
          path: path,
          userId: _user.id, // P2003
        }
      })
    }
    return this.prisma.exclude(_user, ['password'])
  }

  async findAll() {
    const users: User[] = await this.prisma.user.findMany()
    return users.map((user: User) => this.prisma.exclude<any,any>(user, ['password']))
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
      include: {
        pendingFriends: {
          select: {
            id: true,
            username: true
          }
        },
        requestFriends: {
          select: {
            id: true,
            username: true
          }
        },
        friends: {
          select: {
            id: true,
            username: true
          }
        },
        friendOf: {
          select: {
            id: true,
            username: true
          }
        },
        blocked: {
          select: {
            id: true,
            username: true
          }
        },
        blockedBy: {
          select: {
            id: true,
            username: true
          }
        },
      }
    });
    return user === null ? user : this.prisma.exclude<any,any>(user, ['password'])
  }

  async findByFortyTwoLogin(login: string) {
    const user: User | null = await this.prisma.user.findUnique({
      where: {
        ft_login: login
      }
    })
    return user === null ? user : this.prisma.exclude<any,any>(user, ['password'])
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: username,
      },
      include: {
        pendingFriends: {
          select: {
            id: true,
            username: true
          }
        },
        requestFriends: {
          select: {
            id: true,
            username: true
          }
        },
        friends: {
          select: {
            id: true,
            username: true
          }
        },
        friendOf: {
          select: {
            id: true,
            username: true
          }
        },
        blocked: {
          select: {
            id: true,
            username: true
          }
        },
        blockedBy: {
          select: {
            id: true,
            username: true
          }
        },
        channels: true,
        wins: true,
        loses:true
      }
    })
    return user === null ? user : this.prisma.exclude<any,any>(user, ['password'])
  }

  async findOneById(id: number) {
    const user: User | null = await this.prisma.user.findUnique({
      where: {
        id: id,
      }
    })
    return user === null ? user : this.prisma.exclude<any,any>(user, ['password'])
  }

  async updateGameStats(username: string, games: number, mmr: number) {
    const user: User = await this.prisma.user.update({
      where: {
        username: username // P2025
      },
      data: {
        games: games,
        mmr: mmr
      },
    });
    return this.prisma.exclude<any,any>(user, ['password'])
  }

  async updateUsername(username: string, newName: string) {
    const user: User = await this.prisma.user.update({
      where: {
        username: username // P2025
      },
      data: {
        username: newName // P2002
      }
    });
    return this.prisma.exclude<any,any>(user, ['password'])
  }

  async updatePassword(username: string, newPassword: string) {
    const user: User = await this.prisma.user.update({
      where: {
        username: username // P2025/
      },
      data: {
        password: newPassword
      }
    });
    return this.prisma.exclude<any,any>(user, ['password'])
  }

  // async remove(username: string) {
  //   const user: User = await this.prisma.user.delete({
  //     where: {
  //       username: username // P2025
  //     }
  //   });
  //   return this.prisma.exclude<any,any>(user, ['password'])
  // }

  update2FA(id: number, twofa: boolean) {
    return this.prisma.user.update({
      where: {
        id: id // P2025
      },
      data: {
        TwoFA: twofa
      }
    })
  }

  async requestFriendship(id: number, friendId: number) {
    return this.prisma.user.update({
      where: {
        id: id // P2016
      },
      data: {
        pendingFriends: {
          connect: {
            id: friendId // P2025
          }
        }
      }
    });
  }

  async cancelFriendshipRequestById(id: number, friendId: number) {
    return this.prisma.user.update({
      where: {
        id: id // P2025
      },
      data: {
        pendingFriends: {
          disconnect: [{ id: friendId }] // doesn't throw anything
        }
      },
    });
  }

  async cancelFriendshipRequestByName(id: number, username: string) {
    return this.prisma.user.update({
      where: {
        id: id // P2025
      },
      data: {
        pendingFriends: {
          disconnect: [{ username: username }] // doesn't throw anything
        }
      },
    });
  }

  async acceptFriendshipRequestById(id: number, friendId: number) {
    return this.prisma.user.update({
      where: {
        id: id // P2025
      },
      data: {
        requestFriends: {
          disconnect: [{ id: friendId }] // doesn't throw anything
        },
        friends: {
          connect: [{ id: friendId }] // P2025
        },
        friendOf: {
          connect: [{ id: friendId }] // P2025
        },
      },
    });
  }

  async acceptFriendshipRequestByName(id: number, username: string) {
    return this.prisma.user.update({
      where: {
        id: id // P2025
      },
      data: {
        requestFriends: {
          disconnect: [{ username: username }] // doesn't throw anything
        },
        friends: {
          connect: [{ username: username }] // P2025
        },
        friendOf: {
          connect: [{ username: username }] // P2025
        },
      },
      include: {
        friends: {
          select: {
            id: true,
            username: true,
          }
        }
      }
    });
  }

  async dismissFriendshipRequestById(id: number, friendId: number) {
    return this.prisma.user.update({
      where: {
        id: id // P2025
      },
      data: {
        requestFriends: {
          disconnect: [{ id: friendId }] // doesn't throw anything
        }
      },
    });
  }

  async dismissFriendshipRequestByName(id: number, username: string) {
    return this.prisma.user.update({
      where: {
        id: id // P2025
      },
      data: {
        requestFriends: {
          disconnect: [{ username: username }] // doesn't throw anything
        }
      },
    });
  }

  async removeFriendById(id: number, friendId: number) {
    return this.prisma.user.update({
      where: {
        id: id // P2025
      },
      data: {
        friends: {
          disconnect: [{ id: friendId }] // doesn't throw anything
        },
        friendOf: {
          disconnect: [{ id: friendId }] // doesn't throw anything
        },
      },
    });
  }

  async removeFriendByName(id: number, username: string) {
    return this.prisma.user.update({
      where: {
        id: id // P2025
      },
      data: {
        friends: {
          disconnect: [{ username: username }] // doesn't throw anything
        },
        friendOf: {
          disconnect: [{ username: username }] // doesn't throw anything
        },
      },
    });
  }

  async blockByUsername(id: number, username: string) {
    return this.prisma.user.update({
      where: {
        id: id // P2016
      },
      data: {
        blocked: {
          connect: [{ username: username }] // P2025
        }
      }
    })
  }

  async unblockByUsername(id: number, username: string) {
    return this.prisma.user.update({
      where: {
        id: id // P2025
      },
      data: {
        blocked: {
          disconnect: [{ username: username }] // doesn't throw anything
        }
      }
    })
  }

  async isBlocked(id: number, username: string) {
    const blocked = await this.prisma.user.findUnique({
      where: {
        id: id
      },
      select: {
        blocked: {
          select: {
            username: true
          }
        }
      }
    })
    if (blocked === null)
      return false
    const usernames: string[] = blocked.blocked.map((blocked: any) => blocked.username)
    return usernames.some((_username: string) => _username === username)
  }

  async isBlockedBy(id: number, username: string) {
    const blockedBy = await this.prisma.user.findUnique({
      where: {
        id: id
      },
      select: {
        blockedBy: {
          select: {
            username: true
          }
        }
      }
    })
    if (blockedBy === null)
      return false
    const usernames: string[] = blockedBy.blockedBy.map((blocked: any) => blocked.username)
    return usernames.some((_username: string) => _username === username)
  }

  async getChannels(id: number) {
    const channels = await this.prisma.user.findUnique({
      where: {
        id: id
      },
      select: {
        channels: {
          select: {
            name: true
          }
        }
      }
    })
    return channels?.channels.map((channel => channel.name))
  }

  async getDirectMessagePenpals(username: string) {
    const a = await this.prisma.directMessage.findMany({
      distinct: ['senderId', 'receiverId'],
      select: {
        sender: {
          select: {
            username: true
          }
        },
        receiver: {
          select: {
            username: true
          }
        }
      }
    })
    const b = a.flatMap(({ sender, receiver }) => [sender.username, receiver.username])
    const c = b.filter((_username: string) => _username !== username)
    const d = Array.from(new Set(c)) // remove duplicates
    return d
  }

}
