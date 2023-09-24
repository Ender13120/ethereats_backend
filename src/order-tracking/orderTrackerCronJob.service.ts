import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './PrismaService.service';
import { ethers } from 'ethers';
import EtherEatsABI from '../abi/DecentralizedDeliveryService.json';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class OrderTrackerService {
  private readonly logger = new Logger(OrderTrackerService.name);
  private readonly contractAddress =
    '0x03B99A03bd4b73E5c4FAb00C523A17C250BA7700';
  private readonly abi = EtherEatsABI.abi;
  private contract;

  private key = process.env.AES_KEY;

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

  private encrypt(message) {
    const iv = CryptoJS.lib.WordArray.random(128 / 8).toString(
      CryptoJS.enc.Hex,
    ); // Generate a random IV
    const encrypted = CryptoJS.AES.encrypt(message, this.key, {
      iv: CryptoJS.enc.Hex.parse(iv),
    });
    return iv + encrypted.ciphertext.toString(CryptoJS.enc.Hex); // Return the IV and the ciphertext
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
      for (let i = 1; i <= orderCountFromContract.toString(); i++) {
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
              encryptedParams: this.encrypt(
                ethers.utils.toUtf8String(order.encryptedParams),
              ),
              // '4358b158ab16ebc2371bb374885007dc76ed0b0a5d0b611bb7a427e61c9f8157', //, //Placeholder for AES Encryption App
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
