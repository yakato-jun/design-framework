import {
  Controller,
  Get,
  Param,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DesignService } from '../design/design.service';

@Controller('api/sites/:siteId/screens')
export class ScreensController {
  constructor(private readonly designService: DesignService) {}

  @Get(':screenId')
  async getScreenDetail(
    @Param('siteId') siteId: string,
    @Param('screenId') screenId: string,
  ) {
    try {
      return await this.designService.getScreenDetail(siteId, screenId);
    } catch (e) {
      if (e.message === 'SITE_NOT_FOUND') {
        throw new NotFoundException('指定されたサイトが見つかりません');
      }
      if (e.message === 'SCREEN_NOT_FOUND') {
        throw new NotFoundException('指定された画面が見つかりません');
      }
      if (e.message === 'LAYOUT_NOT_FOUND') {
        throw new NotFoundException('レイアウトファイルが見つかりません');
      }
      throw new InternalServerErrorException(e.message);
    }
  }
}
