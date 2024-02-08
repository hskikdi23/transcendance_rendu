import { PickType } from "@nestjs/mapped-types"
import { ChannelDto } from "./channel.dto"

export class UpdateChannelPasswordDto extends PickType(ChannelDto, ['channelName', 'password'] as const) {}