import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  content:    string;

  @IsNotEmpty()
  @IsInt()
  authorId:   number;

  @IsNotEmpty()
  @IsInt()
  channelId:  number;
}
