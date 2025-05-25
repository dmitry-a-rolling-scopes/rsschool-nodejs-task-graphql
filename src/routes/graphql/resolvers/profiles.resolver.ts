import { AbstractResolver } from './resolver.abstract.js';
import { MemberTypeId } from '../../member-types/schemas.js';
import { UUID } from 'node:crypto';

export class ProfilesResolver extends AbstractResolver {
  public async create(
    isMale: boolean,
    yearOfBirth: number,
    userId: UUID,
    memberTypeId: MemberTypeId,
  ) {
    return this.prisma.profile.create({
      data: { isMale, yearOfBirth, userId, memberTypeId },
    });
  }

  public async update(
    id: UUID,
    isMale: boolean,
    yearOfBirth: number,
    memberTypeId: MemberTypeId,
  ) {
    return this.prisma.profile.update({
      where: { id },
      data: { isMale, yearOfBirth, memberTypeId },
    });
  }

  public async delete(id: UUID) {
    return this.prisma.profile.delete({
      where: { id },
    });
  }
}
