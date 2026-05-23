import { auth } from "@/auth.config";

const publicPaths = [
  "/login",
  "/register",
  "/register-instructor",
  "/room-locator",
  "/forgot-password",
  "/reset-password"
];
const publicApiPaths = [
  "/api/register-student",
  "/api/register-instructor",
  "/api/verify-otp",
  "/api/programs",
  "/api/forgot-password",
  "/api/reset-password"
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isPublicApi = pathname.startsWith("/api/auth") || publicApiPaths.some((p) => pathname.startsWith(p));

  const mustChange = (req.auth?.user as { mustChangePassword?: boolean })?.mustChangePassword;

  if (
    req.auth &&
    (pathname === "/login" || pathname === "/register" || pathname === "/register-instructor")
  ) {
    if (mustChange) {
      return Response.redirect(new URL("/change-password", req.url));
    }
    return Response.redirect(new URL("/dashboard", req.url));
  }

  if (req.auth && mustChange) {
    const allowed =
      pathname.startsWith("/change-password") ||
      pathname.startsWith("/api/change-password") ||
      pathname.startsWith("/api/auth");
    if (!allowed) {
      return Response.redirect(new URL("/change-password", req.url));
    }
  }

  if (isPublic || isPublicApi) return;
  if (!req.auth && (pathname.startsWith("/dashboard") || pathname.startsWith("/api/"))) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return Response.redirect(login);
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*",
    "/login",
    "/register",
    "/register-instructor",
    "/change-password",
    "/forgot-password",
    "/reset-password"
  ]
};
