import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PongService } from './pong.service';

@Controller('pong')
export class PongController {
  constructor(private readonly pong: PongService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getGames() {
    return this.pong.getRoomList()
  }
}
