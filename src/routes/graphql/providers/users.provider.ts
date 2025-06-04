import { AbstractProvider } from './provider.abstract.js';
import { UUID } from 'node:crypto';
import { User } from '@prisma/client';

export class UsersProvider extends AbstractProvider {
  public async getUser(id: UUID): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });
  }

  public async getUsers(
    includeSubscribedToUser: boolean = true,
    includeUserSubscribedTo = true,
  ): Promise<User[]> {
    return this.prisma.user.findMany({
      include: {
        subscribedToUser: includeSubscribedToUser,
        userSubscribedTo: includeUserSubscribedTo,
      },
    });
  }

  public async getSubscribedToUsersByAuthorIds(authorIds: UUID[]): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        userSubscribedTo: {
          some: {
            authorId: { in: authorIds },
          },
        },
      },
    });
  }

  public async getUserSubscribedToUsersBySubscriberIds(
    subscriberIds: UUID[],
  ): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        subscribedToUser: {
          some: {
            subscriberId: { in: subscriberIds },
          },
        },
      },
    });
  }
}
