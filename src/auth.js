import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 1 * 24 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        if (!credentials) return null;

        try {
          const res = await fetch(`${process.env.BASE_URL}/users/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            throw new Error("Failed to log in");
          }

          const user = await res.json();

          if (user?.success) {
            return {
              id: user?.user?._id,
              name: user?.user?.name,
              email: user?.user?.email,
              profilePicture: user?.user?.profilePicture,
              token: user?.token,
            };
          }
          if (!user?.success) {
            throw new Error(user?.message);
          }
        } catch (error) {
          throw new Error(error.message || "Login Error");
        }
      },
    }),
  ],
  callbacks: {
    // Store custom user data in the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user?.id;
        token.name = user?.name;
        token.email = user?.email;
        token.profilePicture = user?.profilePicture;
        token.token = user?.token;
      }
      return token;
    },
    // Add extra fields to the session object
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.profilePicture = token.profilePicture;
      session.user.token = token.token;
      return session;
    },
  },
});
