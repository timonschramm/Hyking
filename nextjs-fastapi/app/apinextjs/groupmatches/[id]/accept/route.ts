import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the group match with its chat room
    let groupMatch = await prisma.groupMatch.findUnique({
      where: { id: params.id },
      include: { chatRoom: true },
    });

    if (!groupMatch) {
      return NextResponse.json({ error: 'Group match not found' }, { status: 404 });
    }

    // ✅ Ensure a chat room exists
    let chatRoom = groupMatch.chatRoom;
    if (!chatRoom) {
      console.warn(`⚠️ Chat room missing for groupMatch ${params.id}, creating one now.`);
      chatRoom = await prisma.chatRoom.create({
        data: {
          groupMatch: { connect: { id: params.id } },
        },
      });

      console.log(`✅ Created new chatRoom:`, chatRoom);

      // Fetch updated groupMatch to include the new chat room
      groupMatch = await prisma.groupMatch.findUnique({
        where: { id: params.id },
        include: { chatRoom: true },
      });

      // ✅ Check again to make sure `groupMatch.chatRoom` is not null
      if (!groupMatch?.chatRoom) {
        console.error(`❌ Failed to create or retrieve chat room for groupMatch ${params.id}`);
        return NextResponse.json({ error: 'Failed to create chat room' }, { status: 500 });
      }

      chatRoom = groupMatch.chatRoom; // ✅ Reassign the chatRoom variable
    }

    const chatRoomId = chatRoom.id; // ✅ Safe to use `chatRoom.id`

    // ✅ Use `upsert()` to handle both new and existing users in the group match
    await prisma.profileOnGroupSuggestion.upsert({
      where: {
        profileId_groupMatchId: {
          profileId: user.id,
          groupMatchId: params.id,
        },
      },
      update: { hasAccepted: true }, // ✅ If user already exists, just update
      create: { // ✅ If user is new, create a new record
        profileId: user.id,
        groupMatchId: params.id,
        hasAccepted: true,
      },
    });

    // ✅ Ensure the user is added as a participant in the chat room
    await prisma.participant.upsert({
  where: {
    chatRoomId_profileId: { // ✅ Use the correct unique constraint
      chatRoomId: chatRoomId,
      profileId: user.id,
    },
  },
  update: {}, // No update needed if the record exists
  create: { // ✅ Create a new participant record if needed
    chatRoomId: chatRoomId,
    profileId: user.id,
  },
});

    // ✅ Return the chat room ID (now guaranteed to exist)
    return NextResponse.json({ chatRoomId: chatRoomId });

  } catch (error) {
    console.error('❌ Error accepting group match:', error);
    return NextResponse.json({ error: 'Failed to accept group match' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
