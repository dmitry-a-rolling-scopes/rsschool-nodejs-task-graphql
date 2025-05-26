import { SubscribersOnAuthors, User } from '@prisma/client';

export interface UserExtended extends User {
  userSubscribedTo: SubscribersOnAuthors[];
  subscribedToUser: SubscribersOnAuthors[];
}
