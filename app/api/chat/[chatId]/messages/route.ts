import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: any) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { chatId } = params;
    
    // Verify that the user is a participant in this chat
    const isParticipant = await prisma.chatParticipant.findFirst({
      where: {
        userId: user.id,
        chatId
      }
    });
    
    if (!isParticipant) {
      return NextResponse.json({ error: "You don't have access to this chat" }, { status: 403 });
    }
    
    // Get query parameters for pagination
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const cursor = url.searchParams.get('cursor');
    
    // Fetch messages with pagination
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1 // Skip the cursor
      }),
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });
    
    // Get the next cursor
    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;
    
    return NextResponse.json({
      messages: messages.map((message: { id: any; text: any; type: any; voiceUrl: any; fileUrl: any; createdAt: any; sender: { id: any; name: any; image: any; }; }) => ({
        id: message.id,
        text: message.text,
        type: message.type,
        voiceUrl: message.voiceUrl,
        fileUrl: message.fileUrl,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          image: message.sender.image
        }
      })),
      nextCursor
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: any) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { chatId } = params;
    const { text, type = 'text', voiceUrl, fileUrl } = await request.json();
    
    // Verify that the user is a participant in this chat
    const isParticipant = await prisma.chatParticipant.findFirst({
      where: {
        userId: user.id,
        chatId
      }
    });
    
    if (!isParticipant) {
      return NextResponse.json({ error: "You don't have access to this chat" }, { status: 403 });
    }
    
    // Create the message
    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: user.id,
        text,
        type,
        voiceUrl,
        fileUrl
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });
    
    // Update chat's updatedAt
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });
    
    return NextResponse.json({
      id: message.id,
      text: message.text,
      type: message.type,
      voiceUrl: message.voiceUrl,
      fileUrl: message.fileUrl,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        image: message.sender.image
      }
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
