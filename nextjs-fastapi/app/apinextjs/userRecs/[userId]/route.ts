import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';


export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fastapiResponse = await fetch(`/api/py/recommendations?userID=${params.userId}`);

    
    if (!fastapiResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch user recommendations' }, { status: fastapiResponse.status });
    }

    const response = await fastapiResponse.json();
    const recommendedUserIds: string[] = response.recommendedUserIDs;
    console.log(recommendedUserIds)
    const recommendedProfiles = await prisma.profile.findMany({
      where: { 
        id: {in: recommendedUserIds},
      },
      include: {
        interests:{
          include:{
            interest: true,
          }
        },
        artists: {
          include: {
            artist: true,
          }
        },
        skills: {
          include: {
            skill: true,
            skillLevel: true,
          }
        }

      }
    });

    if (!recommendedProfiles) {
      return NextResponse.json({ error: recommendedUserIds}, { status: 404 });
    }

    const sortedProfiles = recommendedUserIds.map((id) => {
      return recommendedProfiles.find((profile) => profile.id === id);
    });
    return NextResponse.json(sortedProfiles);
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    return NextResponse.json({ error: 'Failed to process recommendation' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}