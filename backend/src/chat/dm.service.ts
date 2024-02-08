import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateDirectMessage } from "./types/CreateDirectMessage";

@Injectable()
export class DirectMessageService {

  constructor(private readonly prisma: PrismaService) {}

  create(message: CreateDirectMessage) {
    return this.prisma.directMessage.create({
      data: {
        content: message.content,
        senderId: message.senderId, // P2023
        receiverId: message.receiverId // P2023
      }
    })
  }

  async findAllMesagesBetweenTwoUsers(id: number, _id: number) {
    const messages = await this.prisma.directMessage.findMany({
      where: {
        OR: [
          {
            senderId: id,
            receiverId: _id
          },
          {
            senderId: _id,
            receiverId: id
          }
        ]
      },
      select: {
        content: true,
        date: true,
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
    return (messages.map(message => ({
      content: message.content,
      sender: message.sender.username,
      reveiver: message.receiver.username,
      date: message.date
    })))
  }

  async getPenpals(username: string) {
    const messages = await this.prisma.directMessage.findMany({
      where: {
        OR: [
          {
            sender: {
              username: username
            }
          },
          {
            receiver: {
              username: username
            }
          }
        ]
      },
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
    return [... new Set(messages.flatMap(message => [message.sender.username, message.receiver.username]))].filter(_username => _username !== username)
  }

}