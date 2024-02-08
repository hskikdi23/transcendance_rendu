import { IsString } from "class-validator";
import { Settings } from "../types/Settings";

export class RequestGameDto {
  @IsString()
  friend: string;

  settings: Settings;
}
