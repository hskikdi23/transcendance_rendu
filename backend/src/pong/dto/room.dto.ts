import { IsNotEmpty, IsString } from "class-validator";

export class RoomDto {
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsNotEmpty()
  @IsString()
  player1: string;

  @IsNotEmpty()
  @IsString()
  player2: string;
}
