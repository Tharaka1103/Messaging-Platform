import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUserFromRequest(request: Request) {
  try {
    // Extract token from cookies
    let token;
    
    // For API routes that receive a Request object
    if (request instanceof Request) {
      const cookieHeader = request.headers.get('cookie');
      if (!cookieHeader) return null;
      
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      token = cookies['chaty-token'];
    } else {
      // For server components using the cookies() function
      const cookieStore = await cookies();
      token = cookieStore.get('chaty-token')?.value;
    }
    
    if (!token) {
      console.log('No token found in request');
      return null;
    }
    
    // Verify token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    
    if (!payload || !payload.id) {
      console.log('Invalid token payload');
      return null;
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });
    
    return user;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}
