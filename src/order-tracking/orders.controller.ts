import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from './PrismaService.service';
import { SignatureConfirmationDto } from 'src/dto/signature-confirmation.dto';
import { ethers } from 'ethers';
import EtherEatsABI from '../abi/DecentralizedDeliveryService.json';
import * as CryptoJS from 'crypto-js';

@Controller('orders')
export class OrdersController {
  private readonly contractAddress =
    '0x03B99A03bd4b73E5c4FAb00C523A17C250BA7700';

  private readonly abi = EtherEatsABI.abi;
  private contract;
  private key = process.env.AES_KEY;

  constructor(private readonly prisma: PrismaService) {
    const provider = new ethers.providers.JsonRpcProvider(
      'https://rpc-mumbai.maticvigil.com',
    );
    this.contract = new ethers.Contract(
      this.contractAddress,
      this.abi,
      provider,
    );
  }

  private decrypt(encryptedData: string): string {
    console.log('Encrypted Data:', encryptedData);

    const iv = CryptoJS.enc.Hex.parse(encryptedData.slice(0, 32)); // Extract the IV
    const ciphertext = CryptoJS.enc.Hex.parse(encryptedData.slice(32)); // Extract the ciphertext

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertext },
      CryptoJS.enc.Hex.parse(this.key),
      { iv: iv },
    );

    return decrypted.toString(CryptoJS.enc.Utf8); // Convert decrypted data to UTF-8 string
  }

  @Get(':address')
  async findAll(@Param('address') address: string) {
    // Check if the address is valid
    if (!ethers.utils.isAddress(address)) {
      throw new BadRequestException('Invalid Ethereum address provided');
    }

    // Query the reputation from the smart contract
    const reputation = await this.contract.reputation(address);

    if (reputation <= 0) {
      throw new BadRequestException('Not Eligible To See Orders');
    }

    const orders = await this.prisma.order.findMany();
    const decryptedOrders = orders.map((order) => ({
      ...order,
      encryptedParams: this.decrypt(order.encryptedParams),
    }));

    return {
      reputation: reputation.toString(),
      orders: decryptedOrders,
    };
  }

  @Get(':address/customer')
  async findCustomer(@Param('address') address: string) {
    const orders = await this.prisma.order.findMany();
    const decryptedOrders = orders.map((order) => ({
      ...order,
      encryptedParams: this.decrypt(order.encryptedParams),
    }));

    return {
      orders: decryptedOrders,
    };
  }

  @Post(':id/signature')
  async addSignature(
    @Param('id') id: number,
    @Body() signatureConfirmationDto: SignatureConfirmationDto,
  ) {
    const { signature, message } = signatureConfirmationDto;

    if (!signature || typeof signature !== 'string') {
      throw new BadRequestException('Invalid signature provided');
    }

    // Retrieve the order from the database
    const order = await this.prisma.order.findUnique({ where: { id: +id } });
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    //verify the message that it actually came from the customer.
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);

    // Compare the recovered address with the customer's address in the database
    if (recoveredAddress.toLowerCase() !== order.customer.toLowerCase()) {
      throw new BadRequestException('Signature verification failed');
    }

    // If verification is successful, update the order with the signature
    return this.prisma.order.update({
      where: { id: +id },
      data: { SignatureConfirmation: signature },
    });
  }
}
