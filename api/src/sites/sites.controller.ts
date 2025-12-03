import {
  Controller,
  Get,
  Param,
  Query,
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

  @Get(':siteId')
  async getSiteDetail(@Param('siteId') siteId: string) {
    try {
      return await this.designService.getSiteDetail(siteId);
    } catch (e) {
      if (e.message === 'SITE_NOT_FOUND') {
        throw new NotFoundException('指定されたサイトが見つかりません');
      }
      throw e;
    }
  }

  @Get(':siteId/transitions')
  async getTransitions(
    @Param('siteId') siteId: string,
    @Query('viewport') viewport?: string,
  ) {
    try {
      return await this.designService.getTransitions(siteId, viewport);
    } catch (e) {
      if (e.message === 'SITE_NOT_FOUND') {
        throw new NotFoundException('指定されたサイトが見つかりません');
      }
      throw e;
    }
  }
}
