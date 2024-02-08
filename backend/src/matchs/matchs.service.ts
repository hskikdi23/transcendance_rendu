import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { Match } from '@prisma/client';

@Injectable()
export class MatchsService {

  constructor(private readonly prisma: PrismaService) {}

  async create(match: CreateMatchDto): Promise<Match> {
    return this.prisma.match.create({
      data: {
        winnerId: match.winnerId, // P2023
        winnerScore: match.winnerScore,
        loserId: match.loserId, // P2023
        loserScore: match.loserScore,
        ranked: match.ranked,
      },
    })
  }

  async findAll(): Promise<Match[]> {
    return this.prisma.match.findMany();
  }

  async findOne(id: number): Promise<Match | null> {
    return this.prisma.match.findUnique({
      where: {
        id: id,
      }
    });
  }

  async update(id: number, match: UpdateMatchDto): Promise<Match> {
    return this.prisma.match.update({
      where: {
        id: id // P2025
      },
      data: {
        winnerId: match.winnerId, // P2003
        winnerScore: match.winnerScore,
        loserId: match.loserId, // P2003
        loserScore: match.loserScore,
        date: match.date, // ??
        ranked: match.ranked,
      },
    });
  }

  async remove(id: number): Promise<Match> {
    return this.prisma.match.delete({
      where: {
        id: id // P2025
      }
    })
  }

  async findHistory(userId: number): Promise<Match[]> {
    return this.prisma.match.findMany({
      where: {
        OR: [
          { winnerId: userId },
          { loserId: userId },
        ]
      },
      orderBy: {
        date: 'desc'
      }
    })
  }

  async removeHistory(userId: number) {
    return this.prisma.match.deleteMany({
      where: {
        OR: [
          { winnerId: userId },
          { loserId: userId },
        ]
      },
    });
  }

}
