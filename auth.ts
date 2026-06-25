import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

const ALLOWED_EMAILS = ['paramedicine101@gmail.com'];
const hasGoogleAuth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const ADMIN_USERNAME = process.env.ALBERT_ADMIN_USERNAME || 'Admin';
const ADMIN_PASSWORD = process.env.ALBERT_ADMIN_PASSWORD || 'Albert123';

export const isAuthConfigured = true;

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'albert-os-local-development-secret',
  trustHost: true,
  providers: [
    Credentials({
      name: 'Albert OS Admin',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const username = String(credentials?.username || '');
        const password = String(credentials?.password || '');

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          return {
            id: 'admin',
            name: 'Admin',
            email: 'admin@albert.local',
          };
        }

        return null;
      },
    }),
    ...(hasGoogleAuth
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') return true;
      const email = user.email?.toLowerCase() ?? '';
      if (!ALLOWED_EMAILS.includes(email)) {
        return false; // Block everyone else
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
