import {
  IsNotEmpty,
  IsInt,
  IsBoolean,
  IsDate,
  Min,
  Max,
} from 'class-validator';

export class UpdateMatchDto {
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

  @IsNotEmpty()
  @IsDate()
  date: Date;

  @IsBoolean()
  ranked: boolean;
}
