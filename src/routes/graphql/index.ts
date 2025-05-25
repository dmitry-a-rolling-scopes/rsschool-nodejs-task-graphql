import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import {
  execute,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  parse,
  specifiedRules,
  validate,
} from 'graphql';
import { UUIDType } from './types/uuid.js';
import { MemberTypesProvider } from './providers/member-types.provider.js';
import { PostsProvider } from './providers/posts.provider.js';
import { ProfilesProvider } from './providers/profiles.provider.js';
import { UsersProvider } from './providers/users.provider.js';
import { PostsResolver } from './resolvers/posts.resolver.js';
import { ProfilesResolver } from './resolvers/profiles.resolver.js';
import { UsersResolver } from './resolvers/users.resolver.js';
import { UUID } from 'node:crypto';
import { MemberTypeId } from '../member-types/schemas.js';
import depthLimit from 'graphql-depth-limit';
import DataLoader from 'dataloader';
import { Profile as ProfileEntity, User as UserEntity } from '@prisma/client';
import { Context } from './context.interface.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  const memberTypesProvider = new MemberTypesProvider(prisma);

  const postsProvider = new PostsProvider(prisma);
  const postsResolver = new PostsResolver(prisma);

  const profilesProvider = new ProfilesProvider(prisma);
  const profilesResolver = new ProfilesResolver(prisma);

  const usersProvider = new UsersProvider(prisma);
  const usersResolver = new UsersResolver(prisma);

  const MemberTypeId = new GraphQLEnumType({
    name: 'MemberTypeId',
    values: {
      BASIC: { value: 'BASIC' },
      BUSINESS: { value: 'BUSINESS' },
    },
  });

  const MemberType = new GraphQLObjectType({
    name: 'MemberType',
    fields: {
      id: { type: new GraphQLNonNull(MemberTypeId) },
      discount: { type: new GraphQLNonNull(GraphQLFloat) },
      postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt) },
    },
  });

  const Profile = new GraphQLObjectType({
    name: 'Profile',
    fields: {
      id: { type: new GraphQLNonNull(UUIDType) },
      isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
      yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
      memberType: {
        type: new GraphQLNonNull(MemberType),
        resolve: async (profile: ProfileEntity, _args, context: Context) => {
          return await context.dataLoaders.memberTypes.load(
            profile.memberTypeId as MemberTypeId,
          );
        },
      },
    },
  });

  const Post = new GraphQLObjectType({
    name: 'Post',
    fields: {
      id: { type: new GraphQLNonNull(UUIDType) },
      title: { type: new GraphQLNonNull(GraphQLString) },
      content: { type: new GraphQLNonNull(GraphQLString) },
    },
  });

  const User = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
      id: { type: new GraphQLNonNull(UUIDType) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      balance: { type: new GraphQLNonNull(GraphQLFloat) },
      profile: {
        type: Profile,
        resolve: async (user: UserEntity, _args, context: Context) => {
          return await context.dataLoaders.profiles.load(user.id as UUID);
        },
      },
      posts: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))),
        resolve: async (user: UserEntity, _args, context: Context) => {
          return await context.dataLoaders.posts.load(user.id as UUID);
        },
      },
      userSubscribedTo: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
        resolve: async (user: UserEntity, _args, context: Context) => {
          return await context.dataLoaders.userSubscribedTo.load(user.id as UUID);
        },
      },
      subscribedToUser: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
        resolve: async (user: UserEntity, _args, context: Context) => {
          return await context.dataLoaders.subscribedToUser.load(user.id as UUID);
        },
      },
    }),
  });

  const RootQueryType = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      memberTypes: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(MemberType))),
        resolve: async () => await memberTypesProvider.getMemberTypes(),
      },
      memberType: {
        type: MemberType,
        args: {
          id: { type: new GraphQLNonNull(MemberTypeId) },
        },
        resolve: async (_, { id }: { id: MemberTypeId }) =>
          await memberTypesProvider.getMemberType(id),
      },
      users: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
        resolve: async () => await usersProvider.getUsers(),
      },
      user: {
        type: User as GraphQLObjectType,
        args: {
          id: { type: new GraphQLNonNull(UUIDType) },
        },
        resolve: async (_, { id }: { id: UUID }) => await usersProvider.getUser(id),
      },
      posts: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))),
        resolve: async () => await postsProvider.getPosts(),
      },
      post: {
        type: Post,
        args: {
          id: { type: new GraphQLNonNull(UUIDType) },
        },
        resolve: async (_, { id }: { id: UUID }) => await postsProvider.getPost(id),
      },
      profiles: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Profile))),
        resolve: async () => await profilesProvider.getProfiles(),
      },
      profile: {
        type: Profile,
        args: {
          id: { type: new GraphQLNonNull(UUIDType) },
        },
        resolve: async (_, { id }: { id: UUID }) => await profilesProvider.getProfile(id),
      },
    },
  });

  const CreateUserInput = new GraphQLInputObjectType({
    name: 'CreateUserInput',
    fields: {
      name: { type: new GraphQLNonNull(GraphQLString) },
      balance: { type: new GraphQLNonNull(GraphQLFloat) },
    },
  });

  const ChangeUserInput = new GraphQLInputObjectType({
    name: 'ChangeUserInput',
    fields: {
      name: { type: GraphQLString },
      balance: { type: GraphQLFloat },
    },
  });

  const CreateProfileInput = new GraphQLInputObjectType({
    name: 'CreateProfileInput',
    fields: {
      isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
      yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
      userId: { type: new GraphQLNonNull(UUIDType) },
      memberTypeId: { type: new GraphQLNonNull(MemberTypeId) },
    },
  });

  const ChangeProfileInput = new GraphQLInputObjectType({
    name: 'ChangeProfileInput',
    fields: {
      isMale: { type: GraphQLBoolean },
      yearOfBirth: { type: GraphQLInt },
      memberTypeId: { type: MemberTypeId },
    },
  });

  const CreatePostInput = new GraphQLInputObjectType({
    name: 'CreatePostInput',
    fields: {
      title: { type: new GraphQLNonNull(GraphQLString) },
      content: { type: new GraphQLNonNull(GraphQLString) },
      authorId: { type: new GraphQLNonNull(UUIDType) },
    },
  });

  const ChangePostInput = new GraphQLInputObjectType({
    name: 'ChangePostInput',
    fields: {
      title: { type: GraphQLString },
      content: { type: GraphQLString },
    },
  });

  const Mutations = new GraphQLObjectType({
    name: 'Mutations',
    fields: {
      createUser: {
        type: new GraphQLNonNull(User),
        args: {
          dto: { type: new GraphQLNonNull(CreateUserInput) },
        },
        resolve: async (_, { dto }: { dto: { name: string; balance: number } }) => {
          return await usersResolver.create(dto.name, dto.balance);
        },
      },
      createProfile: {
        type: new GraphQLNonNull(Profile),
        args: {
          dto: { type: new GraphQLNonNull(CreateProfileInput) },
        },
        resolve: async (
          _,
          {
            dto,
          }: {
            dto: {
              isMale: boolean;
              yearOfBirth: number;
              userId: UUID;
              memberTypeId: MemberTypeId;
            };
          },
        ) => {
          return await profilesResolver.create(
            dto.isMale,
            dto.yearOfBirth,
            dto.userId,
            dto.memberTypeId,
          );
        },
      },
      createPost: {
        type: new GraphQLNonNull(Post),
        args: {
          dto: { type: new GraphQLNonNull(CreatePostInput) },
        },
        resolve: async (
          _,
          { dto }: { dto: { title: string; content: string; authorId: UUID } },
        ) => {
          return await postsResolver.create(dto.title, dto.content, dto.authorId);
        },
      },
      changePost: {
        type: new GraphQLNonNull(Post),
        args: {
          id: { type: new GraphQLNonNull(UUIDType) },
          dto: { type: new GraphQLNonNull(ChangePostInput) },
        },
        resolve: async (
          _,
          {
            id,
            dto,
          }: {
            id: UUID;
            dto: {
              title: string;
              content: string;
            };
          },
        ) => {
          return await postsResolver.update(id, dto.title, dto.content);
        },
      },
      changeProfile: {
        type: new GraphQLNonNull(Profile),
        args: {
          id: { type: new GraphQLNonNull(UUIDType) },
          dto: { type: new GraphQLNonNull(ChangeProfileInput) },
        },
        resolve: async (
          _,
          {
            id,
            dto,
          }: {
            id: UUID;
            dto: { isMale: boolean; yearOfBirth: number; memberTypeId: MemberTypeId };
          },
        ) => {
          return await profilesResolver.update(
            id,
            dto.isMale,
            dto.yearOfBirth,
            dto.memberTypeId,
          );
        },
      },
      changeUser: {
        type: new GraphQLNonNull(User),
        args: {
          id: { type: new GraphQLNonNull(UUIDType) },
          dto: { type: new GraphQLNonNull(ChangeUserInput) },
        },
        resolve: async (
          _,
          {
            id,
            dto,
          }: {
            id: UUID;
            dto: {
              name: string;
              balance: number;
            };
          },
        ) => {
          return await usersResolver.update(id, dto.name, dto.balance);
        },
      },
      deleteUser: {
        type: new GraphQLNonNull(GraphQLString),
        args: {
          id: { type: new GraphQLNonNull(UUIDType) },
        },
        resolve: async (_, { id }: { id: UUID }) => {
          await usersResolver.delete(id);

          return id;
        },
      },
      deletePost: {
        type: new GraphQLNonNull(GraphQLString),
        args: {
          id: { type: new GraphQLNonNull(UUIDType) },
        },
        resolve: async (_, { id }: { id: UUID }) => {
          await postsResolver.delete(id);

          return id;
        },
      },
      deleteProfile: {
        type: new GraphQLNonNull(GraphQLString),
        args: {
          id: { type: new GraphQLNonNull(UUIDType) },
        },
        resolve: async (_, { id }: { id: UUID }) => {
          await profilesResolver.delete(id);

          return id;
        },
      },
      subscribeTo: {
        type: new GraphQLNonNull(GraphQLString),
        args: {
          userId: { type: new GraphQLNonNull(UUIDType) },
          authorId: { type: new GraphQLNonNull(UUIDType) },
        },
        resolve: async (_, { userId, authorId }: { userId: UUID; authorId: UUID }) => {
          await usersResolver.subscribeTo(userId, authorId);

          return userId;
        },
      },
      unsubscribeFrom: {
        type: new GraphQLNonNull(GraphQLString),
        args: {
          userId: { type: new GraphQLNonNull(UUIDType) },
          authorId: { type: new GraphQLNonNull(UUIDType) },
        },
        resolve: async (_, { userId, authorId }: { userId: UUID; authorId: UUID }) => {
          await usersResolver.unsubscribeFrom(userId, authorId);

          return userId;
        },
      },
    },
  });

  const dataLoaders = {
    memberTypes: new DataLoader(async (memberTypeIds) => {
      const memberTypes = await memberTypesProvider.getMemberTypesByIds(
        memberTypeIds as MemberTypeId[],
      );

      return memberTypeIds.map((memberTypeId) =>
        memberTypes.find((memberType) => memberType.id === memberTypeId),
      );
    }),
    posts: new DataLoader(async (userIds) => {
      const posts = await postsProvider.getPostsByAuthorIds(userIds as UUID[]);

      return userIds.map((userId) => posts.filter((post) => post.authorId === userId));
    }),
    profiles: new DataLoader(async (userIds) => {
      const profiles = await profilesProvider.getProfilesByUserIds(userIds as UUID[]);

      return userIds.map((userId) =>
        profiles.find((profile) => profile.userId === userId),
      );
    }),
    subscribedToUser: new DataLoader(async (userIds) => {
      const users = await usersProvider.getSubscribedToUsersByAuthorIds(
        userIds as UUID[],
      );

      return userIds.map(() => users);
    }),
    userSubscribedTo: new DataLoader(async (userIds) => {
      const users = await usersProvider.getUserSubscribedToUsersBySubscriberIds(
        userIds as UUID[],
      );

      return userIds.map(() => users);
    }),
  };

  const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: Mutations,
  });

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req, reply) {
      const document = parse(req.body.query);
      const errors = validate(schema, document, [...specifiedRules, depthLimit(5)]);

      if (errors.length > 0) {
        return reply.send({ errors });
      }

      const result = await execute({
        schema,
        document,
        contextValue: {
          dataLoaders: dataLoaders,
        },
        variableValues: req.body.variables,
      });

      return reply.send(result);
    },
  });
};

export default plugin;
