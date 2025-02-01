import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hikeId } = await req.json();

    if (!hikeId) {
      return NextResponse.json({ error: 'Hike ID is required' }, { status: 400 });
    }

    // Create a new chat room
    const groupMatch = await prisma.groupMatch.create({
  data: {
    description: 'Default description',
    hikeSuggestions: { connect: { id: hikeId } },
    chatRoom: {
      create: {
        participants: { // ✅ Ensure user is added to chatRoom participants
          create: { profileId: user.id }
        }
      }
    },
    profiles: {
      create: { profileId: user.id, hasAccepted: true },
    },
  },
  include: { chatRoom: { include: { participants: true } }, profiles: true },
});

console.log("✅ Group Match Created:", groupMatch);


// Fetch the chat room after creation to verify it exists
if (!groupMatch.chatRoom) {
  console.error("Chat room was not created properly.");
  return NextResponse.json({ error: "Chat room creation failed." }, { status: 500 });
}

const chatRoom = await prisma.chatRoom.findUnique({
  where: { id: groupMatch.chatRoom.id },
});


console.log("Fetched chatRoom after creation:", chatRoom);

    console.log("Created groupMatch:", groupMatch); // 🔍 Debugging step

    // Check if chatRoom exists
    if (!groupMatch.chatRoom) {
      throw new Error('Chat room not found in the group match');
    }

    return NextResponse.json({ chatRoomId: groupMatch.chatRoom.id, profiles: groupMatch.profiles });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}