import { IsString, IsNotEmpty} from "class-validator"

export class SendDirectMessageDto {

  @IsString()
  @IsNotEmpty()
  content: string

  @IsString()
  @IsNotEmpty()
  recipient: string

}
