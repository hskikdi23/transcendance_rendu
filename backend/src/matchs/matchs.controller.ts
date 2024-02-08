import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { MatchsService } from './matchs.service';
import { CreateMatchDto } from './dto/create-match.dto'
import { UpdateMatchDto } from './dto/update-match.dto'
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('matchs')
export class MatchsController {

  constructor(private readonly matchs: MatchsService) {}

  @Post()
  create(@Body() match: CreateMatchDto) {
    return this.matchs.create(match);
  }

  @Get()
  findAll() {
    return this.matchs.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matchs.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() match: UpdateMatchDto) {
    return this.matchs.update(id, match);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.matchs.remove(id);
  }

  @Get('history/:userId')
  findHistory(@Param('userId', ParseIntPipe) userId: number) {
    return this.matchs.findHistory(userId);
  }

  @Delete('history/:userId')
  removeHistory(@Param('userId', ParseIntPipe) userId: number) {
    return this.matchs.removeHistory(userId);
  }



}
