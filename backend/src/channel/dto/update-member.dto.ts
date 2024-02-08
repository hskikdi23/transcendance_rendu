import { IsNotEmpty, IsNumber, IsString, Validate } from "class-validator"
import { UserExist, ChannelExist } from "src/rules"

export class UpdateChannelMemberDto {

  @IsNumber()
  @IsNotEmpty()
  @Validate(UserExist)
  userId: number

  @IsString()
  @IsNotEmpty()
  @Validate(ChannelExist)
  channelName: string

}