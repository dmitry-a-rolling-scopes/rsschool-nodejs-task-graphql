import { AbstractProvider } from './provider.abstract.js';
import { UUID } from 'node:crypto';
import { Profile } from '@prisma/client';

export class ProfilesProvider extends AbstractProvider {
  public async getProfile(id: UUID): Promise<Profile | null> {
    return this.prisma.profile.findUnique({
      where: {
        id: id,
      },
    });
  }

  public async getProfiles(): Promise<Profile[]> {
    return this.prisma.profile.findMany();
  }

  public async getProfilesByUserIds(userIds: UUID[]): Promise<Profile[]> {
    return this.prisma.profile.findMany({
      where: {
        userId: { in: userIds },
      },
    });
  }
}
