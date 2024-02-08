import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';


export class KeyEventDto {
  @IsNotEmpty()
  @IsBoolean()
  press: boolean;

  @IsNotEmpty()
  @IsString()
  key: string;
}
