import { AbstractProvider } from './provider.abstract.js';
import { MemberTypeId } from '../../member-types/schemas.js';
import { MemberType } from '@prisma/client';

export class MemberTypesProvider extends AbstractProvider {
  public async getMemberType(id: MemberTypeId): Promise<MemberType | null> {
    return this.prisma.memberType.findUnique({
      where: {
        id: id,
      },
    });
  }

  public async getMemberTypes(): Promise<MemberType[]> {
    return this.prisma.memberType.findMany();
  }

  public async getMemberTypesByIds(memberTypeIds: MemberTypeId[]): Promise<MemberType[]> {
    return this.prisma.memberType.findMany({
      where: {
        id: { in: memberTypeIds },
      },
    });
  }
}
