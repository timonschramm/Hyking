import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

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

    const { hikeId } = await req.json();
    if (!hikeId) {
      return NextResponse.json({ error: 'Hike ID is required' }, { status: 400 });
    }

    console.log('Changing hike to:', hikeId);

    const updatedGroupMatch = await prisma.groupMatch.update({
      where: { id: params.id },
      data: {
        hikeSuggestions: {
          set: [],
          connect: { id: hikeId },
        },
      },
      include: { hikeSuggestions: true },
    });

    console.log('Updated Group Match:', updatedGroupMatch);
    return NextResponse.json(updatedGroupMatch);
  } catch (error) {
    console.error('Error changing hike:', error);
    return NextResponse.json({ error: 'Failed to change hike' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
