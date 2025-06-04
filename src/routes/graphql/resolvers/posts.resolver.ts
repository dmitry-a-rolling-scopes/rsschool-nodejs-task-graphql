import { AbstractResolver } from './resolver.abstract.js';
import { UUID } from 'node:crypto';

export class PostsResolver extends AbstractResolver {
  public async create(title: string, content: string, authorId: UUID) {
    return this.prisma.post.create({
      data: { title, content, authorId },
    });
  }

  public async update(id: UUID, title: string, content: string) {
    return this.prisma.post.update({
      where: { id },
      data: { title, content },
    });
  }

  public async delete(id: UUID) {
    return this.prisma.post.delete({
      where: { id },
    });
  }
}
