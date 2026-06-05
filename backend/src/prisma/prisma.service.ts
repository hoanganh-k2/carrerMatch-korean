import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;

  constructor() {
    let connectionString = `${process.env.DATABASE_URL}`;
    if (connectionString.startsWith('prisma+postgres://')) {
      try {
        const parsedUrl = new URL(connectionString);
        const apiKey = parsedUrl.searchParams.get('api_key');
        if (apiKey) {
          const decoded = JSON.parse(
            Buffer.from(apiKey, 'base64').toString('utf-8'),
          ) as Record<string, unknown>;
          if (decoded && typeof decoded.databaseUrl === 'string') {
            connectionString = decoded.databaseUrl;
          }
        }
      } catch (err) {
        console.warn(
          'Failed to parse prisma+postgres URL in PrismaService',
          err,
        );
      }
    }
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
