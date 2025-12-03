import { Module } from '@nestjs/common';
import { SitesModule } from './sites/sites.module';
import { ScreensModule } from './screens/screens.module';
import { DesignModule } from './design/design.module';

@Module({
  imports: [DesignModule, SitesModule, ScreensModule],
})
export class AppModule {}
