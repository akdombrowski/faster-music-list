import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
// import { withAuth} from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export const middleware = async (req: NextRequest) => {
  const url = req.nextUrl;

  // Get hostname of request (e.g. demo.vercel.pub, demo.localhost:3000)
  let hostname = req.headers
    .get("host")!
    .replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);

  // special case for Vercel preview deployment URLs
  if (
    hostname.includes("---") &&
    hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
  ) {
    hostname = `${hostname.split("---")[0]}.${
      process.env.NEXT_PUBLIC_ROOT_DOMAIN
    }`;
  }

  const searchParams = req.nextUrl.searchParams.toString();
  // Get the pathname of the request (e.g. /, /about, /blog/first-post)
  const path = `${url.pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ""
  }`;

  // rewrites for app pages
  if (hostname == `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) {
    console.log();
    console.log();
    console.log("getting token...");
    console.log("cookies:", req.cookies.toString());
    console.log();
    console.log("href:", req.nextUrl.href);
    console.log();
    console.log("origin:", req.nextUrl.origin);
    console.log();
    console.log("pathname:", req.nextUrl.pathname);
    console.log();
    console.log("host:", req.nextUrl.host);
    console.log();
    console.log("hostname:", req.nextUrl.hostname);
    console.log();
    console.log("searchParams:", req.nextUrl.searchParams.toString());
    console.log();
    console.log();
    const session = await getToken({ req });
    if (!session && path !== "/login") {
      console.log();
      console.log("!session && path !== '/login'");
      console.log("session:", session);
      console.log("path:", path);
      console.log("redirecting to /login");
      console.log();
      console.log();

      return NextResponse.redirect(new URL("/login", req.url));
    } else if (session && path == "/login") {
      console.log();
      console.log("session && path == '/login'");
      console.log("session:", session);
      console.log("path:", path);
      console.log("redirecting to /");
      console.log();
      console.log();
      return NextResponse.redirect(new URL("/", req.url));
    }

    console.log();
    console.log("session:", session);
    console.log("path:", path);
    console.log(
      "rewriting to:",
      new URL(`/app${path === "/" ? "" : path}`, req.url).href,
    );
    console.log();
    console.log();

    // Could be null session and path === /login
    // Could be a session and path !== /login
    return NextResponse.rewrite(
      new URL(`/app${path === "/" ? "" : path}`, req.url),
    );
  }

  // special case for `vercel.pub` domain
  if (hostname === "vercel.pub") {
    return NextResponse.redirect(
      "https://vercel.com/blog/platforms-starter-kit",
    );
  }

  // rewrite root application to `/home` folder
  if (
    hostname === "localhost:3000" ||
    hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ) {
    return NextResponse.rewrite(
      new URL(`/home${path === "/" ? "" : path}`, req.url),
    );
  }

  // rewrite everything else to `/[domain]/[slug] dynamic route
  return NextResponse.rewrite(new URL(`/${hostname}${path}`, req.url));
};

export default middleware;
