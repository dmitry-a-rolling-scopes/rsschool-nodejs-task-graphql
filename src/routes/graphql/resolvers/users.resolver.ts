import { AbstractResolver } from './resolver.abstract.js';
import { UUID } from 'node:crypto';

export class UsersResolver extends AbstractResolver {
  public async create(name: string, balance: number) {
    return this.prisma.user.create({
      data: { name, balance },
    });
  }

  public async update(id: UUID, name: string, balance: number) {
    return this.prisma.user.update({
      where: { id },
      data: { name, balance },
    });
  }

  public async delete(id: UUID) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  public async subscribeTo(subscriberId: UUID, authorId: UUID) {
    return this.prisma.subscribersOnAuthors.create({
      data: { subscriberId, authorId },
    });
  }

  public async unsubscribeFrom(subscriberId: UUID, authorId: UUID) {
    return this.prisma.subscribersOnAuthors.delete({
      where: {
        subscriberId_authorId: { subscriberId, authorId },
      },
    });
  }
}
