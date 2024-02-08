import { IsNotEmpty } from 'class-validator'
import { ChannelDto } from 'src/channel/dto/channel.dto';

export class CreateChannelDto extends ChannelDto {
  @IsNotEmpty()
  ownerId: number;
}