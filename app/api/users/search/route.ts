import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      console.log('User not authenticated');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get query parameter
    const url = new URL(request.url);
    const query = url.searchParams.get('query');
    
    if (!query || query.length < 3) {
      return NextResponse.json({ error: "Search query must be at least 3 characters" }, { status: 400 });
    }
    
    // Search for users by email or name (exclude current user)
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { email: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } }
            ]
          },
          { id: { not: user.id } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      },
      take: 10
    });
    
    // Since we don't have a Chat model yet, return all users with hasChat = false
    const usersWithChatStatus = users.map(u => ({
      ...u,
      hasChat: false // We can set this to false as we don't have chat functionality yet
    }));
    
    return NextResponse.json(usersWithChatStatus);
    
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
