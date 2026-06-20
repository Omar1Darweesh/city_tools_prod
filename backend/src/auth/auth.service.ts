import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly loginAttempts = new Map<
    string,
    { count: number; resetAt: number }
  >();

  private readonly maxLoginAttempts = 10;
  private readonly loginWindowMs = 15 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private resolvedBranchId(user: {
    branchId: number | null;
    branch?: { id: number } | null;
  }): number | null {
    return user.branchId ?? user.branch?.id ?? null;
  }

  private attemptKey(username: string, clientIp?: string) {
    const user = username.toLowerCase().trim();
    const ip = (clientIp || 'unknown').trim();
    return `${ip}:${user}`;
  }

  private assertLoginAllowed(username: string, clientIp?: string) {
    const key = this.attemptKey(username, clientIp);
    const now = Date.now();
    const entry = this.loginAttempts.get(key);
    if (!entry || now > entry.resetAt) {
      return;
    }
    if (entry.count >= this.maxLoginAttempts) {
      const waitMin = Math.ceil((entry.resetAt - now) / 60000);
      throw new HttpException(
        `Too many login attempts. Try again in ${waitMin} minute(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private recordFailedLogin(username: string, clientIp?: string) {
    const key = this.attemptKey(username, clientIp);
    const now = Date.now();
    const entry = this.loginAttempts.get(key);
    if (!entry || now > entry.resetAt) {
      this.loginAttempts.set(key, {
        count: 1,
        resetAt: now + this.loginWindowMs,
      });
      return;
    }
    entry.count += 1;
    this.loginAttempts.set(key, entry);
  }

  private clearLoginAttempts(username: string, clientIp?: string) {
    this.loginAttempts.delete(this.attemptKey(username, clientIp));
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        branch: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.active) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto, clientIp?: string) {
    this.assertLoginAllowed(loginDto.username, clientIp);

    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      this.recordFailedLogin(loginDto.username, clientIp);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.clearLoginAttempts(loginDto.username, clientIp);

    const branchId = this.resolvedBranchId(user);

    const payload = {
      sub: user.id,
      username: user.username,
      branchId,
    };

    const permissions = user.roles.flatMap((ur: any) =>
      ur.role.permissions.map((rp: any) => rp.permission.name),
    );

    const roles = user.roles.map((ur: any) => ur.role.name);

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        branchId,
        branch: user.branch,
        roles,
        permissions,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // ✅ Step 1: Verify JWT signature
      const payload = this.jwtService.verify(refreshToken);

      // ✅ Step 2: Lookup user in database
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          branch: true,
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // ✅ Step 3: Check if user exists
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // ✅ Step 4: Check if user is active
      if (!user.active) {
        throw new UnauthorizedException('User account is deactivated');
      }

      // ✅ Step 5: Create new tokens with fresh data
      const branchId = this.resolvedBranchId(user);

      const newPayload = {
        sub: user.id,
        username: user.username,
        branchId,
      };

      // ✅ Step 6: Return new tokens with updated user info
      const permissions = user.roles.flatMap((ur: any) =>
        ur.role.permissions.map((rp: any) => rp.permission.name),
      );

      const roles = user.roles.map((ur: any) => ur.role.name);

      return {
        accessToken: this.jwtService.sign(newPayload),
        refreshToken: this.jwtService.sign(newPayload, { expiresIn: '7d' }),
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          branchId,
          branch: user.branch,
          roles,
          permissions,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        branch: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const permissions = user.roles.flatMap((ur: any) =>
      ur.role.permissions.map((rp: any) => rp.permission.name),
    );

    const roles = user.roles.map((ur: any) => ur.role.name);

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      branchId: this.resolvedBranchId(user),
      branch: user.branch,
      roles,
      permissions,
    };
  }
}
