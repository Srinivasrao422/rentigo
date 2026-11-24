import { prisma } from "../config/prisma.js";
import { memoryStore } from "../config/devStore.js";
import { isPostgresConnected } from "../config/db.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";
import { AuthenticatedUser, UserRole } from "../types/index.js";

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole;
    agency?: {
      name: string;
      description?: string;
      address: string;
      city: string;
      state: string;
      postalCode?: string;
      contactPhone: string;
      contactEmail: string;
    };
  }) {
    const role = data.role || "CUSTOMER";
    const usePg = await isPostgresConnected();

    if (usePg) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) {
        throw ApiError.badRequest("An account with this email already exists");
      }

      const passwordHash = await hashPassword(data.password);

      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: role as any,
          ...(role === "AGENCY_OWNER" && data.agency
            ? {
                agency: {
                  create: {
                    name: data.agency.name,
                    description: data.agency.description,
                    address: data.agency.address,
                    city: data.agency.city,
                    state: data.agency.state,
                    postalCode: data.agency.postalCode,
                    contactPhone: data.agency.contactPhone,
                    contactEmail: data.agency.contactEmail,
                    isApproved: true,
                  },
                },
              }
            : {}),
        },
        include: { agency: true },
      });

      const authUser: AuthenticatedUser = {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        firstName: user.firstName,
        lastName: user.lastName,
        agencyId: user.agency?.id,
      };

      const accessToken = generateAccessToken(authUser);
      const refreshToken = generateRefreshToken(authUser);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      return { user: authUser, accessToken, refreshToken };
    }

    // Dev fallback store
    const existing = memoryStore.users.find(
      (u) => u.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existing) {
      throw ApiError.badRequest("An account with this email already exists");
    }

    const passwordHash = await hashPassword(data.password);
    const userId = `u-${Date.now()}`;
    let agencyId: string | undefined;

    if (role === "AGENCY_OWNER" && data.agency) {
      agencyId = `ag-${Date.now()}`;
      memoryStore.agencies.push({
        id: agencyId,
        userId,
        name: data.agency.name,
        description: data.agency.description || null,
        address: data.agency.address,
        city: data.agency.city,
        state: data.agency.state,
        postalCode: data.agency.postalCode || null,
        contactPhone: data.agency.contactPhone,
        contactEmail: data.agency.contactEmail,
        logoUrl: null,
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const newUser = {
      id: userId,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      avatarUrl: null,
      role: role as UserRole,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryStore.users.push(newUser);

    const authUser: AuthenticatedUser = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      agencyId,
    };

    const accessToken = generateAccessToken(authUser);
    const refreshToken = generateRefreshToken(authUser);

    return { user: authUser, accessToken, refreshToken };
  }

  static async login(email: string, pass: string) {
    const usePg = await isPostgresConnected();

    if (usePg) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { agency: true },
      });

      if (!user || !user.isActive) {
        throw ApiError.unauthorized("Invalid email or password");
      }

      const match = await comparePassword(pass, user.password);
      if (!match) {
        throw ApiError.unauthorized("Invalid email or password");
      }

      const authUser: AuthenticatedUser = {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        firstName: user.firstName,
        lastName: user.lastName,
        agencyId: user.agency?.id,
      };

      const accessToken = generateAccessToken(authUser);
      const refreshToken = generateRefreshToken(authUser);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      return { user: authUser, accessToken, refreshToken };
    }

    // Dev fallback store
    const user = memoryStore.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user || !user.isActive) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const match = await comparePassword(pass, user.passwordHash);
    if (!match) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const agency = memoryStore.agencies.find((a) => a.userId === user.id);

    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      agencyId: agency?.id,
    };

    const accessToken = generateAccessToken(authUser);
    const refreshToken = generateRefreshToken(authUser);

    return { user: authUser, accessToken, refreshToken };
  }

  static async refreshToken(incomingRefreshToken: string) {
    try {
      const decoded = verifyRefreshToken(incomingRefreshToken);
      const usePg = await isPostgresConnected();

      if (usePg) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          include: { agency: true },
        });

        if (!user || user.refreshToken !== incomingRefreshToken) {
          throw ApiError.unauthorized("Invalid refresh token");
        }

        const authUser: AuthenticatedUser = {
          id: user.id,
          email: user.email,
          role: user.role as UserRole,
          firstName: user.firstName,
          lastName: user.lastName,
          agencyId: user.agency?.id,
        };

        const newAccessToken = generateAccessToken(authUser);
        const newRefreshToken = generateRefreshToken(authUser);

        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: newRefreshToken },
        });

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
      }

      // Memory fallback
      const user = memoryStore.users.find((u) => u.id === decoded.id);
      if (!user) {
        throw ApiError.unauthorized("User no longer exists");
      }

      const agency = memoryStore.agencies.find((a) => a.userId === user.id);
      const authUser: AuthenticatedUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        agencyId: agency?.id,
      };

      const newAccessToken = generateAccessToken(authUser);
      const newRefreshToken = generateRefreshToken(authUser);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }
  }

  static async logout(userId: string) {
    const usePg = await isPostgresConnected();
    if (usePg) {
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });
    }
    return { success: true };
  }

  static async getProfile(userId: string) {
    const usePg = await isPostgresConnected();
    if (usePg) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          agency: true,
          createdAt: true,
        },
      });
      if (!user) throw ApiError.notFound("User not found");
      return user;
    }

    const user = memoryStore.users.find((u) => u.id === userId);
    if (!user) throw ApiError.notFound("User not found");
    const agency = memoryStore.agencies.find((a) => a.userId === userId);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isActive: user.isActive,
      agency: agency || null,
      createdAt: user.createdAt,
    };
  }
}
