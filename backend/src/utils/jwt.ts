import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { AuthenticatedUser } from "../types/index.js";

export const generateAccessToken = (user: AuthenticatedUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      agencyId: user.agencyId,
    },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn as any }
  );
};

export const generateRefreshToken = (user: AuthenticatedUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn as any }
  );
};

export const verifyAccessToken = (token: string): AuthenticatedUser => {
  return jwt.verify(token, config.jwt.accessSecret) as AuthenticatedUser;
};

export const verifyRefreshToken = (token: string): { id: string; email: string; role: any } => {
  return jwt.verify(token, config.jwt.refreshSecret) as { id: string; email: string; role: any };
};
