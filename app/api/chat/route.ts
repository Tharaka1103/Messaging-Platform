import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// Get all chats for current user
export async function GET(request: any) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Fetch all chats where the current user is a participant
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
        }
      }
    });
    
    // Transform data for frontend
    const formattedChats = chats.map(chat => {
      // Find the other participant (not the current user)
      const otherParticipant = chat.participants.find(p => p.userId !== user.id);
      const otherUser = otherParticipant ? otherParticipant.user : null;
      
      // Get last message if it exists
      const lastMessage = chat.messages.length > 0 ? chat.messages[0] : null;
      
      return {
        id: chat.id,
        name: otherUser?.name || 'Unknown User',
        image: otherUser?.image || null,
        isOnline: false, // This would be determined by a real-time service
        lastMessageAt: lastMessage?.createdAt || chat.createdAt,
        lastMessage: lastMessage 
          ? {
              id: lastMessage.id,
              text: lastMessage.text,
              type: lastMessage.type,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            } 
          : { 
              text: 'Start a conversation', 
              type: 'text',
              createdAt: chat.createdAt 
            },
        unreadCount: 0, // This would be calculated based on read receipts
      };
    });
    
    return NextResponse.json(formattedChats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}

// Create a new chat
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    // Check if user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true }
    });
    
    if (!otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check if chat already exists
    const existingChat = await prisma.chat.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                userId: user.id
              }
            }
          },
          {
            participants: {
              some: {
                userId: otherUser.id
              }
            }
          }
        ]
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    });
    
    if (existingChat) {
      return NextResponse.json({
        id: existingChat.id,
        name: otherUser.name,
        image: otherUser.image,
        lastMessageAt: existingChat.updatedAt,
        lastMessage: { text: 'Start a conversation', type: 'text' }
      });
    }
    
    // Create new chat
    const newChat = await prisma.chat.create({
      data: {
        participants: {
          create: [
            { userId: user.id },
            { userId: otherUser.id }
          ]
        }
      }
    });
    
    return NextResponse.json({
      id: newChat.id,
      name: otherUser.name,
      image: otherUser.image,
      lastMessageAt: newChat.createdAt,
      lastMessage: { text: 'Start a conversation', type: 'text' }
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
  }
}
