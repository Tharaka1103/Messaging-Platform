import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const publicPaths = ['/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Check if the path is public
  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath));
  
  // Get the token from cookie
  const token = request.cookies.get('chaty-token')?.value;
  
  // If the path is public and the user is logged in, redirect to home
  if (isPublicPath && token) {
    try {
      // Verify token
      await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      
      // If token is valid, redirect to home page
      return NextResponse.redirect(new URL('/', request.url));
    } catch (error) {
      // If token verification fails, allow access to public path
      return NextResponse.next();
    }
  }
  
  // If the path is protected and the user is not logged in, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
};
