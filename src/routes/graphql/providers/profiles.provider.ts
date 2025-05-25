import { AbstractProvider } from './provider.abstract.js';
import { httpErrors } from '@fastify/sensible';
import { UUID } from 'node:crypto';

export class ProfilesProvider extends AbstractProvider {
  public async getProfile(id: UUID) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        id: id,
      },
    });

    if (profile === null) {
      throw httpErrors.notFound();
    }

    return profile;
  }

  public async getProfiles() {
    return this.prisma.profile.findMany();
  }
}
