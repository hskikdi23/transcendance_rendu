import { IsNotEmpty, IsString } from 'class-validator'

export class BanKickDto {
  @IsNotEmpty()
  @IsString()
  username: string
  channelName: string
}
