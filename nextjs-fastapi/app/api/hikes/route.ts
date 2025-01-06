import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch activities excluding ones the user has already swiped on
    const hikes = await prisma.activity.findMany({
      where: {
        AND: [
          { primaryImageId: { not: "" } },
          {
            // Exclude activities that have been swiped by this user
            NOT: {
              swipes: {
                some: {
                  userId: user.id
                }
              }
            }
          }
        ]
      },
      take: 10,
      include: {
        category: true,
        images: true,
      },
    });

    return NextResponse.json(hikes);
  } catch (error) {
    console.log("error: " + error)
    return NextResponse.json({ error: 'Failed to fetch hikes, error: ' + error }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}