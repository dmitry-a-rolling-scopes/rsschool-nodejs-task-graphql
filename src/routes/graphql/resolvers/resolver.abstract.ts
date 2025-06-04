import { PrismaClient } from '@prisma/client';

export abstract class AbstractResolver {
  constructor(protected readonly prisma: PrismaClient) {}
}
