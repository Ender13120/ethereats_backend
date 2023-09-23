import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './PrismaService.service';
import { ethers } from 'ethers';
import EtherEatsABI from '../abi/DecentralizedDeliveryService.json';

@Injectable()
export class OrderTrackerService {
  private readonly logger = new Logger(OrderTrackerService.name);
  private readonly contractAddress =
    '0x03B99A03bd4b73E5c4FAb00C523A17C250BA7700';
  private readonly abi = EtherEatsABI.abi;
  private contract;

  constructor(private prisma: PrismaService) {
    const provider = new ethers.providers.JsonRpcProvider(
      'https://rpc-mumbai.maticvigil.com',
    );
    this.contract = new ethers.Contract(
      this.contractAddress,
      this.abi,
      provider,
    );
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    this.logger.log('Starting to check:');
    try {
      const orderCountFromContract = await this.contract.orderCount();
      this.logger.debug(
        `Order count from contract: ${orderCountFromContract.toString()}`,
      );

      // Fetch the latest order count from the database
      const latestOrderCount = await this.prisma.orderCount.findFirst({
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          count: true,
        },
      });

      const lastStoredOrderCount = latestOrderCount
        ? latestOrderCount.count
        : 0;

      // If there are new orders, fetch their details and store them in the database
      for (let i = 0; i <= orderCountFromContract.toString(); i++) {
        const order = await this.contract.orders(i);
        this.logger.log(order);

        // Check if order already exists
        const existingOrder = await this.prisma.order.findUnique({
          where: { id: i },
        });

        if (existingOrder) {
          // Update the order if it exists
          await this.prisma.order.update({
            where: { id: i },
            data: {
              customer: order.customer,
              deliverer: order.deliverer,
              amount: order.amount.toString(),
              timestamp: order.timestamp.toString(),
              encryptedParams: ethers.utils.toUtf8String(order.encryptedParams),
              isAccepted: order.isAccepted,
              isCompleted: order.isCompleted,
            },
          });
        } else {
          // Create a new order if it doesn't exist
          await this.prisma.order.create({
            data: {
              id: i, // Assuming the order's ID corresponds to its position in the mapping
              customer: order.customer,
              deliverer: order.deliverer,
              amount: order.amount.toString(),
              timestamp: order.timestamp.toString(),
              encryptedParams: ethers.utils.toUtf8String(order.encryptedParams),
              isAccepted: order.isAccepted,
              isCompleted: order.isCompleted,
            },
          });
        }
      }

      // Update the order count in the database
      if (orderCountFromContract > lastStoredOrderCount) {
        await this.prisma.orderCount.create({
          data: {
            count: parseInt(orderCountFromContract.toString(), 10),
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch or store order details: ${error.message}`,
      );
    }
  }
}
