import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Authorization token that must have been created previously. See : https://developer.spotify.com/documentation/web-api/concepts/authorization
  const token = "undefined";
  async function fetchWebApi(endpoint: string, method: string, body?: JSON) {
    const res = await fetch(`https://api.spotify.com/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method,
      body: JSON.stringify(body),
    });
    return await res.json();
  }

  async function getTopTracks() {
    // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
    return await fetchWebApi(
      "v1/me/top/tracks?time_range=long_term&limit=5",
      "GET",
    );
  }

  const topTracks = await getTopTracks();
  return NextResponse.json({ items: topTracks.items });
}
