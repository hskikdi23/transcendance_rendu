import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, ConflictException, UnprocessableEntityException, UnauthorizedException, BadRequestException, Logger, UseFilters, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { AuthGuard } from '@nestjs/passport';
import { ChannelDto } from './dto/channel.dto';
import * as bcrypt from 'bcrypt';
import { TranscendenceExceptionsFilter } from '../filters';
import { UserByIdPipe, ChannelByNamePipe } from 'src/pipes';
import { ChannelStatus, Prisma } from '@prisma/client';
import { UpdateChannelPasswordDto } from './dto/update-password.dto';

@Controller('channel')
@UseGuards(AuthGuard('jwt'))
@UseFilters(TranscendenceExceptionsFilter)
export class ChannelController {

  private readonly logger: Logger = new Logger(ChannelController.name, { timestamp: true })

  constructor(private readonly channel: ChannelService) {}

  @Post()
  async create(@Req() request: any, @Body() channel: ChannelDto) {

    // we could also hash into the channel service
    if (channel.status === 'Protected') {
      try {
        channel.password = await bcrypt.hash(channel.password, 2) // bigger salt would take too long
      } catch (e) {
        throw new UnprocessableEntityException('Error about the channel password encryption.')
      }
    }

    const _channel: CreateChannelDto = {
      channelName: channel.channelName,
      ownerId: request.user.id,
      status: channel.status,
      password: channel.password
    }

    try {
      await this.channel.create(_channel)
    } catch(e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException('channel already exist')
        } else if (e.code === 'P2003' || e.code === 'P2025') {
          throw new ForbiddenException('channel owner cannot be set')
        }
      } else {
        throw e
      }
    }
  }

  @Delete('kick/:channelName/:userId')
  async kickUser(@Req() request: any, @Param('userId', UserByIdPipe) user: any, @Param('channelName', ChannelByNamePipe) channel: any) {

    // kicked user has to be member of the channel
    const isMember: boolean = channel.users.some((_user: any) => _user.id === user.id)
    if (isMember === false)
      throw new BadRequestException('user not member of channel')

    // only admins can kick
    const isAdmin: boolean = channel.admins.some((admin: any) => admin.id === request.user.id)
    if (isAdmin === false)
      throw new BadRequestException('user not admin of channel')

    // owner cannot be kicked
    const isOwner: boolean = user.id === channel.ownerId
    if (isOwner === true)
      throw new BadRequestException('user is owner of the channel')

    // cannot kick yourself
    if (request.user.id === user.id)
      throw new BadRequestException('user cannot kick himself')

    // This try/catch because the built-in exception layer returns '500 Internal Error' on any prisma exception.
    // And we want to avoid 500! After those previous checks it should be good, but none of the above logic is atomic.
    // Between those 'verification steps' channel could have been deleted, user could have been deleted too, etc.
    // None of the above pipes act as unconditionnal guarantees.
    try {
      await this.channel.removeUser(channel.name, user.id)
      this.logger.log(`user ${request.user.id} kicked user ${user.id} from channel ${channel.name}`)
      return `user ${request.user.id} kicked user ${user.id} from channel ${channel.name}`
    } catch(e) {
      throw new UnauthorizedException(`cannot remove user ${user.id} from channel ${channel.name} (internal error)`)
    }
  }

  @Delete('ban/:channelName/:userId')
  async banUser(@Req() request: any, @Param('userId', UserByIdPipe) user: any, @Param('channelName', ChannelByNamePipe) channel: any) {

    // banned user has to be member of the channel
    const isMember: boolean = channel.users.some((_user: any) => _user.id === user.id)
    if (isMember === false)
      throw new BadRequestException('user not member of channel')

    // only admins can ban
    const isAdmin: boolean = channel.admins.some((admin: any) => admin.id === request.user.id)
    if (isAdmin === false)
      throw new BadRequestException('user not admin of channel')

    // owner cannot be banned
    const isOwner: boolean = user.id === channel.ownerId
    if (isOwner === true)
      throw new BadRequestException('user is owner of the channel')

    // cannot ban yourself
    if (request.user.id === user.id)
      throw new BadRequestException('user cannot ban himself')

    // This try/catch because the built-in exception layer returns '500 Internal Error' on any prisma exception.
    // And we want to avoid 500! After those previous checks it should be good, but none of the above logic is atomic.
    // Between those 'verification steps' channel could have been deleted, user could have been deleted too, etc.
    // None of the above pipes act as unconditionnal guarantees.
    try {
      await this.channel.removeUser(channel.name, user.id)
      await this.channel.banUser(channel.name, user.id)
      this.logger.log(`user ${request.user.id} banned user ${user.id} from channel ${channel.name}`)
      return `user ${request.user.id} banned user ${user.id} from channel ${channel.name}`
    } catch(e) {
      throw new UnauthorizedException(`cannot remove user ${user.id} from channel ${channel.name} (internal error)`)
    }
  }

  @Patch('promote/:channelName/:userId')
  async promoteAdmin(@Req() request: any, @Param('userId', UserByIdPipe) user: any, @Param('channelName', ChannelByNamePipe) channel: any) {

    // promoted user has to be member of the channel
    const isMember: boolean = channel.users.some((_user: any) => _user.id === user.id)
    if (isMember === false)
      throw new BadRequestException('user not member of channel')

    // admins cannot be promoted twice
    const isAdmin: boolean = channel.admins.some((admin: any) => admin.id === user.id)
    if (isAdmin === true)
      throw new BadRequestException('user not admin of channel')

    // only owner can promote to admin
    const isOwner: boolean = request.user.id === channel.ownerId
    if (isOwner === false)
      throw new UnauthorizedException('need to be the channel owner')

    try {
      await this.channel.promoteAdmin(channel.name, user.id)
      this.logger.log(`user ${request.user.id} has promoted user ${user.id} admin of channel ${channel.name}`)
      return `user ${request.user.id} has promoted user ${user.id} admin of channel ${channel.name}`
    } catch(e) {
      throw new UnauthorizedException(`Cannot promote user ${user.id} admin of channel ${channel.name} (internal error)`)
    }
  }

  @Patch('revoke/:channelName/:userId')
  async revokeAdmin(@Req() request: any, @Param('userId', UserByIdPipe) user: any, @Param('channelName', ChannelByNamePipe) channel: any) {

    // revoked user has to be member of the channel
    const isMember: boolean = channel.users.some((_user: any) => _user.id === user.id)
    if (isMember === false)
      throw new BadRequestException('user not member of channel')

    // only admins can be revoked
    const isAdmin: boolean = channel.admins.some((admin: any) => admin.id === user.id)
    if (isAdmin === false)
      throw new BadRequestException('user not admin of channel')

    // only owner can revoke admins
    const isOwner: boolean = request.user.id === channel.ownerId
    if (isOwner === false)
      throw new UnauthorizedException('need to be the channel owner')

    // cannot revoke yourself
    if (request.user.id === user.id)
      throw new BadRequestException('user cannot revoke himself')

    try {
      await this.channel.revokeAdmin(channel.name, user.id)
      this.logger.log(`user ${request.user.id} has revoked user ${user.id} as admin of channel ${channel.name}`)
      return `user ${request.user.id} has revoked user ${user.id} as admin of channel ${channel.name}`
    } catch(e) {
      throw new UnauthorizedException(`Cannot revoke user ${user.id} as admin of channel ${channel.name} (internal error)`)
    }
  }

  @Get()
  findAll() {
    return this.channel.findAll();
  }

  @Get(':name')
  async findOne(@Param('name', ChannelByNamePipe) channel: any) {
    return channel
  }

  @Delete(':name')
  async deleteOne(@Req() request: any, @Param('name', ChannelByNamePipe) channel: any) {

    if (request.user.id !== channel.ownerId)
      throw new UnauthorizedException('channel can only be delete by its owner')

    try {
      await this.channel.deleteByName(channel.name)
    } catch(e) {
      throw new NotFoundException('channel not found')
    }
  }

  @Patch('join')
  async joinChannel(@Body() channel: ChannelDto, @Req() req: any) {

    if (await this.channel.findByName(channel.channelName) === null)
      throw new NotFoundException('channel not found')

    if (await this.channel.isBanned(channel.channelName, req.user.id) === true)
      throw new UnauthorizedException('banned')

    if (channel.status === ChannelStatus.Protected)
      if (await this.channel.verifyPassword(channel.channelName, channel.password) === false)
        throw new UnauthorizedException('wrong password')

    return this.channel.addUserToChannel(channel.channelName, req.user.id);
  }

  @Patch('leave/:channelName')
  async leaveChannel(@Param('channelName') channelName: string, @Req() req: any) {
    return this.channel.leave(channelName, req.user.id);
  }

  @Patch('password')
  async updatePassword(@Req() request: any, @Body() body: UpdateChannelPasswordDto) {

    // only owner can change password
    if (await this.channel.isOwner(body.channelName, request.user.id) === false)
      throw new UnauthorizedException('Channel ownership required')

    try {
      body.password = await bcrypt.hash(body.password, 2) // bigger salt would take too long
    } catch (e) {
      throw new UnprocessableEntityException('Error about channel password encryption')
    }

    try {
      await this.channel.updatePassword(body.channelName, body.password)
    } catch(e) {
      throw new ConflictException('Error while updating channel password')
    }
  }

  @Patch('status')
  async updateStatus(@Req() request: any, @Body() body: ChannelDto) {

    // only owner can change status
    if (await this.channel.isOwner(body.channelName, request.user.id) === false)
      throw new UnauthorizedException('Channel ownership required')

    if (body.status === ChannelStatus.Protected) {
      try {
        body.password = await bcrypt.hash(body.password, 2) // bigger salt would take too long
      } catch (e) {
        throw new UnprocessableEntityException('Error about channel password encryption')
      }
    }

    try {
      await this.channel.updateStatus(body.channelName, body.password, body.status)
    } catch(e) {
      throw new ConflictException('Error while updating channel status')
    }

  }

  @Patch('invite')
  async inviteUser(@Req() request: any, @Body() body: any) {

    // only owner can invite
    if (await this.channel.isOwner(body.channelName, request.user.id) === false)
      throw new UnauthorizedException('Channel ownership required')

    try {
      await this.channel.inviteUser(body.channelName, body.userId)
    } catch(e) {
      throw new ConflictException('wtf') // channel not found or already invited
    }

  }

}
