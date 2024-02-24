import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export default auth(async (req: NextRequest) => {
  // req.auth
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.redirect(new URL("/dashboard", req.url));
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
