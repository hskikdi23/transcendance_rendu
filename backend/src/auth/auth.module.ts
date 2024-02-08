import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './local.strategy';
import { Jwt2FAStrategy } from './jwt.2fa.strategy';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersGateway } from 'src/users/users.gateway';

@Module({
  imports: [
      UsersModule,
      JwtModule.register({
          secret: jwtConstants.secret,
          signOptions: { expiresIn: '60s' }
      })
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy, Jwt2FAStrategy, PrismaService, UsersGateway],
  exports: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}

