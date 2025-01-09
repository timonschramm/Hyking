import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const skills = await prisma.skill.findMany({
      include: {
        skillLevels: true
      }
    });

    return NextResponse.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skillId, skillLevelId } = await request.json();

    if (!skillId || !skillLevelId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userSkill = await prisma.userSkill.upsert({
      where: {
        profileId_skillId: {
          profileId: user.id,
          skillId: skillId
        }
      },
      update: {
        skillLevelId: skillLevelId
      },
      create: {
        id: crypto.randomUUID(),
        profileId: user.id,
        skillId: skillId,
        skillLevelId: skillLevelId
      },
      include: {
        skill: true,
        skillLevel: true
      }
    });

    return NextResponse.json(userSkill);
  } catch (error) {
    console.error('Error updating skill:', error);
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skillId } = await request.json();

    if (!skillId) {
      return NextResponse.json({ error: 'Missing skillId' }, { status: 400 });
    }

    await prisma.userSkill.delete({
      where: {
        profileId_skillId: {
          profileId: user.id,
          skillId: skillId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
} 