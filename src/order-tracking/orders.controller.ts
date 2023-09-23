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

@Controller('orders')
export class OrdersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll() {
    return this.prisma.order.findMany();
  }

  @Post(':id/signature')
  async addSignature(
    @Param('id') id: number,
    @Body() signatureConfirmationDto: SignatureConfirmationDto,
  ) {
    const { signature } = signatureConfirmationDto;

    if (!signature || typeof signature !== 'string') {
      throw new BadRequestException('Invalid signature provided');
    }

    return this.prisma.order.update({
      where: { id: +id },
      data: { SignatureConfirmation: signature },
    });
  }
}
