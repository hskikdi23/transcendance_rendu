import { IsNotEmpty, IsNumber, IsString, Validate } from "class-validator";
import { UserExist } from "src/rules";

export class MuteDto {

  @IsString()
  @IsNotEmpty()
  channelName: string

  @IsNumber()
  @IsNotEmpty()
  // @Validate(UserExist)
  userId: number

  @IsNumber()
  @IsNotEmpty()
  seconds: number

}