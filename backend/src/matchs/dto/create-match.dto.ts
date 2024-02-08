import {
  IsNotEmpty,
  IsInt,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateMatchDto {
  @IsNotEmpty()
  @IsInt()
  winnerId: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(10)
  winnerScore: number;

  @IsNotEmpty()
  @IsInt()
  loserId: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(9)
  loserScore: number;

  @IsBoolean()
  ranked: boolean;
}
