import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activityId, action } = await request.json();

    if (!activityId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Record the swipe
    const swipe = await prisma.activitySwipe.upsert({
      where: {
        userId_activityId: {
          userId: user.id,
          activityId: activityId,
        },
      },
      update: {
        action: action,
        timestamp: new Date(),
      },
      create: {
        userId: user.id,
        activityId: activityId,
        action: action,
      },
      select: {
        id: true,
        action: true,
        timestamp: true
      }
    });

    return NextResponse.json(swipe);
  } catch (error) {
    console.error('Error recording swipe:', error);
    return NextResponse.json({ error: 'Failed to record swipe' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's swiped activities
    const swipes = await prisma.activitySwipe.findMany({
      where: {
        userId: user.id,
      },
      include: {
        activity: true,
      },
    });

    return NextResponse.json(swipes);
  } catch (error) {
    console.error('Error fetching swipes:', error);
    return NextResponse.json({ error: 'Failed to fetch swipes' }, { status: 500 });
  }
} 