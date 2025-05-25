import { AbstractProvider } from './provider.abstract.js';
import { httpErrors } from '@fastify/sensible';
import { UUID } from 'node:crypto';

export class UsersProvider extends AbstractProvider {
  public async getUser(id: UUID) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (user === null) {
      throw httpErrors.notFound();
    }

    return user;
  }

  public async getUsers() {
    return this.prisma.user.findMany();
  }
}
