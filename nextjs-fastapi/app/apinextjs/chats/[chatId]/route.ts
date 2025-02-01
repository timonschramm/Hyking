import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      console.error("❌ Unauthorized: No valid user found.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!params?.chatId) {
      console.error("❌ Missing chatId in request.");
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    console.log(`📌 Fetching chatRoom with ID: ${params.chatId}`);

    // Ensure we fetch all necessary details for debugging
    const chatRoom = await prisma.chatRoom.findUnique({
  where: { id: params.chatId },
  include: {
    participants: {
      include: { profile: true }  // ✅ Ensure user profiles are loaded
    },
    messages: {
      include: { sender: true },
      orderBy: { createdAt: 'asc' }
    },
    groupMatch: {
      include: {
        profiles: {
          include: { profile: true }  // ✅ Load all users in the group
        },
        hikeSuggestions: true,  // ✅ Ensure hike details show up
      }
    },
    match: {
      include: {
        users: {
          include: { user: true }
        }
      }
    }
  }
});


    if (!chatRoom) {
      console.error(`❌ Chat not found in DB: ${params.chatId}`);
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if the user is a participant (security check)
    const isParticipant = chatRoom.participants.some(p => p.profileId === user.id);
    if (!isParticipant) {
      console.error(`❌ User is not a participant in chat: ${params.chatId}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log(`✅ Chat found and accessible to user:`, chatRoom);
    return NextResponse.json(chatRoom);
  } catch (error) {
    console.error('❌ Error fetching chat:', error);
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
