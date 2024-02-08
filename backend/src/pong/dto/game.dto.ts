import { IsNotEmpty, IsString } from "class-validator";

export class GameDto {
  @IsNotEmpty()
  @IsString()
  gameName: string;
}
