import { auth } from "@/auth.config";

const publicPaths = [
  "/login",
  "/register",
  "/room-locator",
  "/forgot-password",
  "/reset-password"
];
const publicApiPaths = ["/api/register-student", "/api/programs", "/api/forgot-password", "/api/reset-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isPublicApi = pathname.startsWith("/api/auth") || publicApiPaths.some((p) => pathname.startsWith(p));

  if (req.auth && (pathname === "/login" || pathname === "/register")) {
    return Response.redirect(new URL("/dashboard", req.url));
  }
  if (isPublic || isPublicApi) return;
  if (!req.auth && (pathname.startsWith("/dashboard") || pathname.startsWith("/api/"))) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return Response.redirect(login);
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/login", "/register", "/forgot-password", "/reset-password"]
};

