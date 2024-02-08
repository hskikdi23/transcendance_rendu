import { Injectable } from "@nestjs/common";
import { ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { UsersService } from "./users/users.service";
import { ChannelService } from "./channel/channel.service";

@ValidatorConstraint({ async: true })
@Injectable()
export class UserExist implements ValidatorConstraintInterface {

  constructor(private readonly users: UsersService) {}

  async validate(userId: number): Promise<boolean> {
    const user = await this.users.findById(userId)
    return user !== null
  }

  defaultMessage(): string {
    return 'user not found'
  }
}

ValidatorConstraint({ async: true })
@Injectable()
export class ChannelExist implements ValidatorConstraintInterface {

  constructor(private readonly channel: ChannelService) {}

  async validate(channelName: string): Promise<boolean> {
    const channel = await this.channel.findByName(channelName)
    return channel !== null
  }

  defaultMessage(): string {
    return 'channel not found'
  }
}