import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, BadRequestException } from '@nestjs/common';
import { jwtConstants } from './constants';
import { Request } from "express";
import { UsersService } from 'src/users/users.service';
import { User } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UsersService) {
    super({
      ignoreExpiration: true,
      secretOrKey: jwtConstants.secret,
      jwtFromRequest: ExtractJwt.fromExtractors([(request: Request) => {
        return request?.cookies?.jwt
      }])
    });
  }

  // TODO (?): typedef the payload
  async validate(payload: any): Promise<Omit<User, 'password'>> {

    const user: Omit<User, 'password'> | null = await this.userService.findById(payload.sub)

    if (user === null)
      throw new BadRequestException('User not found')

    return user
  }
}

