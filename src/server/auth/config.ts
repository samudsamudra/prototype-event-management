import { PrismaAdapter } from "@auth/prisma-adapter";
import type { AuthOptions, DefaultSession } from "next-auth"; // Use type-only imports
import type { Adapter, AdapterUser } from "next-auth/adapters"; // Use type-only import
import GoogleProvider from "next-auth/providers/google";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      role: "ADMIN" | "DOSEN" | "MAHASISWA";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "DOSEN" | "MAHASISWA";
  }
}

/**
 * Extend the AdapterUser type to include the role property
 */
declare module "next-auth/adapters" {
  interface AdapterUser {
    role: "ADMIN" | "DOSEN" | "MAHASISWA";
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */

// Wrap the PrismaAdapter to include the `role` property
const CustomPrismaAdapter = (db: typeof import("~/server/db").db) => {
  const adapter = PrismaAdapter(db);

  return {
    ...adapter,
    getUser: async (id: string) => {
      const user = await adapter.getUser?.(id);
      if (user) {
        return {
          ...user,
          role: (user as AdapterUser).role as "ADMIN" | "DOSEN" | "MAHASISWA",
        };
      }
      return null;
    },
    getUserByEmail: async (email: string) => {
      const user = await adapter.getUserByEmail?.(email);
      if (user) {
        return {
          ...user,
          role: (user as AdapterUser).role as "ADMIN" | "DOSEN" | "MAHASISWA",
        };
      }
      return null;
    },
    // Extend other adapter methods if necessary
  };
};

export const authConfig: AuthOptions = {
  adapter: CustomPrismaAdapter(db) as unknown as Adapter, // Use the custom adapter
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: ({
      session,
      user,
    }: {
      session: DefaultSession;
      user: { id: string; role: "ADMIN" | "DOSEN" | "MAHASISWA" };
    }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        role: user.role,
      },
    }),
  },
};
