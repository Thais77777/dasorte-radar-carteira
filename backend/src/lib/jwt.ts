import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { RoleName } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: RoleName;
  name: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
