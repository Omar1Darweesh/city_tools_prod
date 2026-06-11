import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { DeliveryZonesService } from './delivery-zones.service';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { SalesModule } from '../sales/sales.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [AuthModule, SalesModule, SettingsModule],
  controllers: [StoreController],
  providers: [StoreService, DeliveryZonesService, PrismaService],
})
export class StoreModule {}
