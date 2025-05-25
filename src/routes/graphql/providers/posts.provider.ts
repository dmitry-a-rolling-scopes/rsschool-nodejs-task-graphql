import { AbstractProvider } from './provider.abstract.js';
import { httpErrors } from '@fastify/sensible';
import { UUID } from 'node:crypto';

export class PostsProvider extends AbstractProvider {
  public async getPost(id: UUID) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: id,
      },
    });

    if (post === null) {
      throw httpErrors.notFound();
    }

    return post;
  }

  public async getPosts() {
    return this.prisma.post.findMany();
  }
}
