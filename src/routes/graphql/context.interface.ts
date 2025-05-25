import DataLoader from 'dataloader';
import { UUID } from 'node:crypto';
import { MemberType, Post, Profile, User } from '@prisma/client';
import { MemberTypeId } from '../member-types/schemas.js';

export interface Context {
  dataLoaders: {
    memberTypes: DataLoader<MemberTypeId, MemberType[]>;
    profiles: DataLoader<UUID, Profile[]>;
    posts: DataLoader<UUID, Post[]>;
    subscribedToUser: DataLoader<UUID, User[]>;
    userSubscribedTo: DataLoader<UUID, User[]>;
  };
}
