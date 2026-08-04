import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ConflictError, UnauthorizedError } from '../../lib/errors';
import { LoginBody, RegisterBody } from './auth.schemas';

const SALT_ROUNDS = 10;

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: RegisterBody) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        cart: { create: {} },
      },
    });

    return user;
  }

  async login(data: LoginBody) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    return user;
  }
}
