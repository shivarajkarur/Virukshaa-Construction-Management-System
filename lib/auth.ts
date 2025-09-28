import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDB from "./db";
import AdminProfile from "@/models/AdminProfile";
import Supervisor from "@/models/Supervisor";
import Client from "@/models/ClientModel";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) {
          throw new Error("Please enter your email/username, password, and role");
        }

        const identifier = String(credentials.email).trim();
        const password = String(credentials.password);
        const role = String(credentials.role).trim().toLowerCase();

        if (!['superadmin', 'supervisor', 'client'].includes(role)) {
          throw new Error("Invalid role. Must be one of: superadmin, supervisor, client");
        }

        await connectToDB();

        // Match by email OR username (case-insensitive)
        const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`^${escapeRegExp(identifier)}$`, 'i');

        let user: any = null;
        if (role === 'superadmin') {
          user = await AdminProfile.findOne({ $or: [{ email: regex }, { username: regex }] });
        } else if (role === 'supervisor') {
          user = await Supervisor.findOne({ $or: [{ email: regex }, { username: regex }] }).select('+password');
        } else if (role === 'client') {
          user = await Client.findOne({ $or: [{ email: regex }, { username: regex }] }).select('+password');
        }

        if (!user) {
          throw new Error("No user found with these credentials");
        }

        const stored = (user as any).password as string | undefined;
        const isValid = stored ? stored === password : false;

        if (!isValid) {
          throw new Error("Invalid password");
        }

        const name = (role === 'superadmin') ? (user.adminName || user.name || 'Admin') : (user.name || 'User');
        return {
          id: user._id.toString(),
          name,
          email: user.email,
          role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    };
  }

  interface User {
    id: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}
