import {
  AuthOptions,
  getServerSession,
  TokenSet,
  type NextAuthOptions,
} from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import NextAuth from "next-auth";
import type { NextRequest } from "next/server";

const VERCEL_DEPLOYMENT = !!process.env.VERCEL_URL;

// const prisma = new PrismaClient();
export const authOptions: AuthOptions = {
  providers: [
    // GitHubProvider({
    //   clientId: process.env.AUTH_GITHUB_ID as string,
    //   clientSecret: process.env.AUTH_GITHUB_SECRET as string,
    //   profile(profile) {
    //     return {
    //       id: profile.id.toString(),
    //       name: profile.name || profile.login,
    //       gh_username: profile.login,
    //       email: profile.email,
    //       image: profile.avatar_url,
    //     };
    //   },
    // }),
    SpotifyProvider({
      clientId: process.env.AUTH_SPOTIFY_ID as string,
      clientSecret: process.env.AUTH_SPOTIFY_SECRET as string,
      authorization: {
        params: {
          // https://developer.spotify.com/documentation/web-api/concepts/scopes#user-read-playback-position
          scope:
            "user-read-private user-read-email user-read-recently-played user-top-read user-follow-read user-read-playback-position playlist-modify-public playlist-modify-private playlist-read-collaborative playlist-read-private user-read-currently-playing user-read-playback-state ",
        },
      },
      profile(profile) {
        return {
          id: profile.id,
          display_name: profile.display_name,
          email: profile.email,
          images: profile.images,
        };
      },
    }),
  ],
  pages: {
    signIn: `/login`,
    verifyRequest: `/login`,
    error: "/login", // Error code passed in query string as ?error=
  },
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: `${VERCEL_DEPLOYMENT ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // When working on localhost, the cookie domain must be omitted entirely (https://stackoverflow.com/a/1188145)
        domain: VERCEL_DEPLOYMENT
          ? `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
          : undefined,
        secure: VERCEL_DEPLOYMENT,
      },
    },
  },
  callbacks: {
    jwt: async ({ token, user, account, profile }) => {
      if (user) {
        token.user = user;
      }
      return token;
    },

    session: async ({ session, token, user }) => {
      const [spotify] = await prisma.account.findMany({
        where: { userId: user.id, provider: "spotify" },
      });
      if (!spotify.expires_at || spotify.expires_at * 1000 < Date.now()) {
        // If the access token has expired, try to refresh it
        try {
          // https://accounts.spotify.com/.well-known/openid-configuration
          // We need the `token_endpoint`.
          const response = await fetch("https://oauth2.spotifyapis.com/token", {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.AUTH_SPOTIFY_ID as string,
              client_secret: process.env.AUTH_SPOTIFY_SECRET as string,
              grant_type: "refresh_token",
              refresh_token: spotify.refresh_token as string,
            }),
            method: "POST",
          });

          const tokens: TokenSet = await response.json();

          if (!response.ok) throw tokens;

          const expiresIn = tokens.expires_in as number;

          if (!expiresIn) {
            throw new Error("doesn't have expires_in", {
              cause: { tokens },
            });
          }

          await prisma.account.update({
            data: {
              access_token: tokens.access_token,
              expires_at: Math.floor(Date.now() / 1000 + expiresIn),
              refresh_token: tokens.refresh_token ?? spotify.refresh_token,
            },
            where: {
              provider_providerAccountId: {
                provider: "spotify",
                providerAccountId: spotify.providerAccountId,
              },
            },
          });
        } catch (error) {
          console.error("Error refreshing access token", error);
          // The error property will be used client-side to handle the refresh token error
          session.error = "RefreshAccessTokenError";
        }
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      return true;
    },
  },
};

export function getSession() {
  return getServerSession(authOptions) as Promise<{
    user: {
      id: string;
      sub: string;
      username: string;
      email: string;
      image: [];
    };
  } | null>;
}

export function withSiteAuth(action: any) {
  return async (
    formData: FormData | null,
    siteId: string,
    key: string | null,
  ) => {
    const session = await getSession();
    if (!session) {
      return {
        error: "Not authenticated",
      };
    }
    const site = await prisma.site.findUnique({
      where: {
        id: siteId,
      },
    });
    if (!site || site.userId !== session.user.id) {
      return {
        error: "Not authorized",
      };
    }

    return action(formData, site, key);
  };
}

export function withPostAuth(action: any) {
  return async (
    formData: FormData | null,
    postId: string,
    key: string | null,
  ) => {
    const session = await getSession();
    if (!session?.user.id) {
      return {
        error: "Not authenticated",
      };
    }
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        site: true,
      },
    });
    if (!post || post.userId !== session.user.id) {
      return {
        error: "Post not found",
      };
    }

    return action(formData, post, key);
  };
}

export const { handlers, auth } = NextAuth(authOptions);
