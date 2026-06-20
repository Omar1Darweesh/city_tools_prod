import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BranchScopeService {
  constructor(private prisma: PrismaService) {}

  async resolveBranchId(
    userId: number,
    requestedBranchId?: number,
  ): Promise<number | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const isAdmin = user.roles.some((ur) => ur.role.name === 'ADMIN');

    if (isAdmin) {
      return requestedBranchId ?? user.branchId ?? undefined;
    }

    if (
      requestedBranchId != null &&
      user.branchId != null &&
      requestedBranchId !== user.branchId
    ) {
      throw new ForbiddenException('Cannot access data for another branch');
    }

    return requestedBranchId ?? user.branchId ?? undefined;
  }
}
