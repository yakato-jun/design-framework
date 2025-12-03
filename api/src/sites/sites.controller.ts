import {
  Controller,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { DesignService } from '../design/design.service';

@Controller('api/sites')
export class SitesController {
  constructor(private readonly designService: DesignService) {}

  @Get()
  async getSites() {
    return this.designService.getSites();
  }

  @Get(':siteId/transitions')
  async getTransitions(@Param('siteId') siteId: string) {
    try {
      return await this.designService.getTransitions(siteId);
    } catch (e) {
      if (e.message === 'SITE_NOT_FOUND') {
        throw new NotFoundException('指定されたサイトが見つかりません');
      }
      throw e;
    }
  }
}
