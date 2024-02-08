import { ArgumentMetadata, BadRequestException, Injectable, ParseIntPipe, PipeTransform } from "@nestjs/common";
import { UsersService } from "./users/users.service";
import { ChannelService } from "./channel/channel.service";

@Injectable()
export class UserByIdPipe extends ParseIntPipe implements PipeTransform<string, Promise<any>> {

  constructor (private readonly userService: UsersService) {
    super()
  }

  async transform(value: string, metadata: ArgumentMetadata): Promise<any> {
    const val: number = await super.transform(value, metadata)
    const user: any = await this.userService.findById(val)
    if (user === null)
      throw new BadRequestException('Validation failed (user not found)')
    return user
  }
}

@Injectable()
export class UserByUsernamePipe implements PipeTransform<string, Promise<any>> {

  constructor (private readonly userService: UsersService) {}

  async transform(value: string, metadata: ArgumentMetadata): Promise<any> {
    const user: any = await this.userService.findByUsername(value)
    if (user === null)
      throw new BadRequestException('Validation failed (user not found)')
    return user
  }
}

@Injectable()
export class ChannelByNamePipe implements PipeTransform<string, Promise<any>> {

  constructor (private readonly channel: ChannelService) {}

  async transform(channelName: string, metadata: ArgumentMetadata): Promise<any> {
    const channel: any = await this.channel.findByName(channelName)
    if (channel === null)
      throw new BadRequestException('Validation failed (channel not found)')
    return channel
  }
}

@Injectable()
export class FileSizeValidationPipe implements PipeTransform<Express.Multer.File, Express.Multer.File> {
  transform(value: any, metadata: ArgumentMetadata) {


    if (value.mimetype !== 'image/png' && value.mimetype !== 'image/jpg')
      throw new BadRequestException('Wrong file format. Only jpg and png are supported.')

    if (value.size > 100000) // 100 kb
      throw new BadRequestException('File too big. Limit is 100kb.')

    return value
  }
}
