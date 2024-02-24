import NextAuth, { type NextAuthConfig } from "next-auth";
import Spotify from "next-auth/providers/spotify";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

const VERCEL_DEPLOYMENT = !!process.env.VERCEL_URL;

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
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
    Spotify({
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
  // adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log("*********************");
      console.log("*********************");
      console.log("in redirect callback");
      console.log("*********************");
      console.log("*********************");

      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
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

          const tokens = await response.json();

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
          // session.error = "RefreshAccessTokenError";
        }
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log("*********************");
      console.log("*********************");
      console.log("in signin callback");
      console.log("*********************");
      console.log("*********************");

      return true;
    },
  },
});
