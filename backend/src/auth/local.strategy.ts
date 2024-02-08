import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // TODO: typedef arguments with proper dto
  async validate(username: string, _password: string): Promise<Omit<User, 'password'>> {

    // we use prisma service instead of user service cause we want the user's password field
    const user: User | null = await this.prisma.user.findUnique({ where: { username: username }})

    if (user === null)
      throw new BadRequestException("Username doesn't exist")

    // TODO: remove `as string`
    if (await bcrypt.compare(_password, user.password as string) === false)
      throw new ForbiddenException('Wrong password')

    // TODO: select only id field
    const { password, ...result } = user;
    return result;

  }

}