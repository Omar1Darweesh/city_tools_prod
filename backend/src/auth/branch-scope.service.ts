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
      include: {
        branch: true,
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const isAdmin = user.roles.some((ur) => ur.role.name === 'ADMIN');
    const userBranchId = user.branchId ?? user.branch?.id ?? undefined;

    if (requestedBranchId != null) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: requestedBranchId },
      });
      if (!branch) {
        throw new ForbiddenException('Invalid branch');
      }
    }

    if (isAdmin) {
      return requestedBranchId ?? userBranchId;
    }

    if (
      requestedBranchId != null &&
      userBranchId != null &&
      requestedBranchId !== userBranchId
    ) {
      throw new ForbiddenException('Cannot access data for another branch');
    }

    return requestedBranchId ?? userBranchId;
  }
}
