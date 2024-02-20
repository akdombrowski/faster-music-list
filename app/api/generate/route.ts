import { Configuration, OpenAIApi } from "openai-edge";
import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { NextResponse } from "next/server";

export async function POST(req: Request): Promise<NextResponse> {
  if (
    process.env.NODE_ENV != "development" &&
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  ) {
    const ip = req.headers.get("x-forwarded-for");
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(50, "1 d"),
    });

    const { success, limit, reset, remaining } = await ratelimit.limit(
      `platforms_ratelimit_${ip}`,
    );
  }

  return NextResponse.json({ ok: true });
}
