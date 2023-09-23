import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderTrackingModule } from './order-tracking/order-tracking.module';
import { SignatureTrackingModule } from './signature-tracking/signature-tracking.module';
import { ScheduleModule } from '@nestjs/schedule';
import { OrdersController } from './order-tracking/orders.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    OrderTrackingModule,
    SignatureTrackingModule,
  ],
  controllers: [AppController, OrdersController],
  providers: [AppService],
})
export class AppModule {}
