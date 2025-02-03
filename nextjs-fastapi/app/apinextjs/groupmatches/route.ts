import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { groupMatchListView } from '@/types/groupMatch';

// GET: Fetch all group matches for the current user
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await (await supabase).auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupMatches = await prisma.groupMatch.findMany({
      select: {
        ...groupMatchListView,
        profiles: {
          select: {
            profileId: true,
            hasAccepted: true,
            profile: {
              select: {
                id: true,
                imageUrl: true,
                displayName: true
              }
            }
          }
        }
      },
    });

    // Add currentUserId and isMember to each group match
    const groupMatchesWithCurrentUser = groupMatches.map((match) => ({
      ...match,
      currentUserId: user.id,
      isMember: match.profiles.some(p => p.profileId === user.id)
    }));

    return NextResponse.json(groupMatchesWithCurrentUser);
  } catch (error) {
    console.error('Error fetching group matches:', error);
    return NextResponse.json({ error: 'Failed to fetch group matches' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST: Create a new group match with a selected hike
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
    const chatRoom = await prisma.chatRoom.create({
      data: {
        // No `name` field is required based on your schema
      },
    });

    // Create a new group match
    const groupMatch = await prisma.groupMatch.create({
      data: {
        description: 'Default description', // Add this field if required
        hikeSuggestions: {
          connect: { id: hikeId },
        },
        chatRoom: {
          connect: { id: chatRoom.id },
        },
        profiles: {
          create: {
            profileId: user.id,
            hasAccepted: true,
          },
        },
      },
      include: {
        chatRoom: true, // Ensure this matches the relation name in your schema
      },
    });

    // Check if chatRoom exists
    if (!groupMatch.chatRoom) {
      throw new Error('Chat room not found in the group match');
    }

    return NextResponse.json({ chatRoomId: groupMatch.chatRoom.id });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH: Change the hike for an existing group match
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Update the group match with the new hike
    const updatedGroupMatch = await prisma.groupMatch.update({
      where: { id: params.id },
      data: {
        hikeSuggestions: {
          connect: { id: hikeId },
        },
      },
      include: {
        hikeSuggestions: true,
      },
    });

    return NextResponse.json(updatedGroupMatch);
  } catch (error) {
    console.error('Error changing hike:', error);
    return NextResponse.json({ error: 'Failed to change hike' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}