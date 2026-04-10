import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const ALLOWED_EMAILS = ['paramedicine101@gmail.com'];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user }) {
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
