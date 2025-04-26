import { clerkClient, clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  try {
    const response = await clerkClient();
    const user = await response.users.getUser(userId);
    const role = user.publicMetadata?.role as string | undefined;

    if (role === 'admin' && req.nextUrl.pathname === "/dashboard") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // Prevent non-admin users from accessing admin routes
    if (role !== "admin" && req.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Redirect authenticated users trying to access public routes
    if (req.nextUrl.pathname === "/sign-in" || req.nextUrl.pathname === "/sign-up") {
      return NextResponse.redirect(new URL(role === "admin" ? "/admin/dashboard" : "/dashboard", req.url));
    }
  } catch (error) {
    console.error("Error fetching user data from Clerk:", error);
    return NextResponse.redirect(new URL("/error", req.url));
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};