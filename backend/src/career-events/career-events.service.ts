import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CareerEventsService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper utility to convert BigInt values to string for JSON serialization
  private serializeBigInt(data: unknown): unknown {
    if (data === null || data === undefined) return data;
    if (typeof data === 'bigint') return data.toString();
    if (Array.isArray(data)) {
      return data.map((item: unknown) => this.serializeBigInt(item));
    }
    if (typeof data === 'object') {
      const result: Record<string, unknown> = {};
      const obj = data as Record<string, unknown>;
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = this.serializeBigInt(obj[key]);
        }
      }
      return result;
    }
    return data;
  }

  async create(data: Prisma.CareerEventCreateInput): Promise<unknown> {
    const event = await this.prisma.careerEvent.create({
      data,
    });
    return this.serializeBigInt(event);
  }

  async findAll(): Promise<unknown> {
    const events = await this.prisma.careerEvent.findMany({
      include: {
        user: true,
        job: true,
      },
    });
    return this.serializeBigInt(events);
  }

  async findOne(eventId: bigint): Promise<unknown> {
    const event = await this.prisma.careerEvent.findUnique({
      where: { eventId },
      include: {
        user: true,
        job: true,
      },
    });
    if (!event) {
      throw new NotFoundException(
        `CareerEvent with ID "${eventId.toString()}" not found`,
      );
    }
    return this.serializeBigInt(event);
  }

  async update(
    eventId: bigint,
    data: Prisma.CareerEventUpdateInput,
  ): Promise<unknown> {
    // Ensure event exists first
    await this.findOne(eventId);
    const updated = await this.prisma.careerEvent.update({
      where: { eventId },
      data,
    });
    return this.serializeBigInt(updated);
  }

  async remove(eventId: bigint): Promise<unknown> {
    // Ensure event exists first
    await this.findOne(eventId);
    const deleted = await this.prisma.careerEvent.delete({
      where: { eventId },
    });
    return this.serializeBigInt(deleted);
  }
}
