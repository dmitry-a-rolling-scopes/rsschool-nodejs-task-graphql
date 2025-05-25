import { AbstractProvider } from './provider.abstract.js';
import { UUID } from 'node:crypto';
import { Post } from '@prisma/client';

export class PostsProvider extends AbstractProvider {
  public async getPost(id: UUID): Promise<Post | null> {
    return this.prisma.post.findUnique({
      where: {
        id: id,
      },
    });
  }

  public async getPosts(): Promise<Post[]> {
    return this.prisma.post.findMany();
  }

  public async getPostsByAuthorIds(authorIds: UUID[]): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: {
        authorId: { in: authorIds },
      },
    });
  }
}
