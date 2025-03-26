import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { hasAdminAccess } from "@/lib/utils";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path starts with /admin
  if (pathname.startsWith('/admin')) {
    // Get the token from the request
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Check if user has admin access
    if (!token || !hasAdminAccess(token.role as string, token.email as string)) {
      const loginUrl = new URL('/login', request.url);
      // Add a message to show after redirect
      loginUrl.searchParams.set('message', 'You need admin access to view this page');
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Also protect admin API routes for extra security
  if (pathname.startsWith('/api/admin')) {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    // Check if user has admin access
    if (!token || !hasAdminAccess(token.role as string, token.email as string)) {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: 'Unauthorized' 
        }),
        { 
          status: 401,
          headers: { 'content-type': 'application/json' }
        }
      );
    }
  }
  
  // If the above conditions are not met, proceed with the request
  return NextResponse.next();
}

// Configure middleware to only run on specific paths
export const config = {
  matcher: [
    '/admin/:path*',  // Matches all paths starting with /admin
    '/api/admin/:path*', // Matches all API routes for admin
  ],
}; 