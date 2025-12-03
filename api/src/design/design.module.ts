import { Module, Global } from '@nestjs/common';
import { DesignService } from './design.service';

@Global()
@Module({
  providers: [DesignService],
  exports: [DesignService],
})
export class DesignModule {}
