import { Module } from '@nestjs/common';
import { PrismaService } from './PrismaService.service';
import { OrderTrackerService } from './orderTrackerCronJob.service';

@Module({
  providers: [PrismaService, OrderTrackerService],
  exports: [PrismaService],
})
export class OrderTrackingModule {}
