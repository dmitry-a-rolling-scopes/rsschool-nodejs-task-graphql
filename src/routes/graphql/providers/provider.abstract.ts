import { PrismaClient } from '@prisma/client';

export abstract class AbstractProvider {
  constructor(protected readonly prisma: PrismaClient) {}
}
