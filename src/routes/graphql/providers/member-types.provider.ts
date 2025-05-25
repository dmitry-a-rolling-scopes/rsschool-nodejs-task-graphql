import { AbstractProvider } from './provider.abstract.js';
import { httpErrors } from '@fastify/sensible';
import { UUID } from 'node:crypto';

export class MemberTypesProvider extends AbstractProvider {
  public async getMemberType(id: UUID) {
    const memberType = await this.prisma.memberType.findUnique({
      where: {
        id: id,
      },
    });

    if (memberType === null) {
      throw httpErrors.notFound();
    }

    return memberType;
  }

  public async getMemberTypes() {
    return this.prisma.memberType.findMany();
  }
}
