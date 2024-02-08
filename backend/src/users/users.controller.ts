import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ConflictException, UnprocessableEntityException, NotFoundException, ParseIntPipe, UseFilters, Res, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUsernameDto, UpdatePasswordDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';
import { TranscendenceExceptionsFilter } from 'src/filters';
import { rmSync } from 'fs';
import { Response } from 'express';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
@UseFilters(TranscendenceExceptionsFilter)
export class UsersController {

  constructor(private readonly users: UsersService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Get('id/:id')
  findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.users.findOneById(id);
  }

  @Get(':username')
  findOneByUsername(@Param('username') username: string) {
    return this.users.findByUsername(username);
  }

  @Patch('username')
  async updateUsername(@Body() body: UpdateUsernameDto, @Req() req: any) {

    // would be cleaner to use `@MaxLength()`into `CreateUserDto`
    if (body.username.length > 21)
      throw new UnauthorizedException('Username too long (21 chars max)')

    try {
      await this.users.updateUsername(req.user.username, body.username);
    } catch (e) {
      throw new ConflictException('This username is already used')
    }
  }

  @Patch('password')
  async updatePassword(@Body() body: UpdatePasswordDto, @Req() req: any) {

    let hash
    try {
      hash = await bcrypt.hash(body.password, 2) // bigger salt would take too long
    } catch (e) {
      throw new UnprocessableEntityException('Error about your password encryption')
    }

    try {
      await this.users.updatePassword(req.user.username, hash);
    } catch (e) {
      throw new ConflictException('Error while updating your password')
    }
  }

  // @Delete()
  // async remove(@Req() req: any, @Res({ passthrough: true }) response: Response) {
  //   try {
  //     await this.users.remove(req.user.username)
  //     rmSync(`/app/images/${req.user.username}`, { recursive: true })
  //     response.cookie('jwt', '', { expires: new Date(0) }); // same as GET '/auth/logout'
  //   } catch(e) {
  //     throw new NotFoundException('User not found')
  //   }
  // }

  @Post('friendship/request/:id')
  requestFriendship(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.users.requestFriendship(req.user.id, id)
  }

  @Post('friendship/cancelById/:id')
  cancelFriendshipRequestById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.users.cancelFriendshipRequestById(req.user.id, id)
  }

  @Post('friendship/cancelByName/:username')
  cancelFriendshipRequestByName(@Param('username') username: string, @Req() req: any) {
    return this.users.cancelFriendshipRequestByName(req.user.id, username)
  }

  @Post('friendship/acceptById/:id')
  acceptFriendshipRequestById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.users.acceptFriendshipRequestById(req.user.id, id)
  }

  @Post('friendship/acceptByName/:username')
  acceptFriendshipRequestByName(@Param('username') username: string, @Req() req: any) {
    return this.users.acceptFriendshipRequestByName(req.user.id, username);
  }

  @Post('friendship/dismissById/:id')
  dismissFriendshipRequestById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.users.dismissFriendshipRequestById(req.user.id, id)
  }

  @Post('friendship/dismissByName/:username')
  dismissFriendshipRequestByName(@Param('username') username: string, @Req() req: any) {
    return this.users.dismissFriendshipRequestByName(req.user.id, username)
  }

  @Post('friendship/removeById/:id')
  removeFriendById(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.users.removeFriendById(req.user.id, id)
  }

  @Post('friendship/removeByName/:username')
  removeFriendByName(@Param('username') username: string, @Req() req: any) {
    return this.users.removeFriendByName(req.user.id, username)
  }

  @Patch('block/:username')
  blockByUsername(@Param('username') username: string, @Req() req: any) {
    return this.users.blockByUsername(req.user.id, username)
  }

  @Patch('unblock/:username')
  unblockByUsername(@Param('username') username: string, @Req() req: any) {
    return this.users.unblockByUsername(req.user.id, username)
  }

  @Get('me/channel')
  getChannels(@Req() request: any) {
    return this.users.getChannels(request.user.id)
  }

  @Get('me/dm')
  getDirectMessagePenpals(@Req() request: any) {
    return this.users.getDirectMessagePenpals(request.user.username)
  }

}
