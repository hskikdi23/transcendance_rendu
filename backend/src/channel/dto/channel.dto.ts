import { IsString, IsNotEmpty, IsEnum } from 'class-validator'
import { ChannelStatus } from '@prisma/client';

export class ChannelDto {
  @IsNotEmpty()
  @IsString()
  channelName: string;

  @IsEnum(ChannelStatus)
  status: ChannelStatus

  @IsString()
  password: string
}
