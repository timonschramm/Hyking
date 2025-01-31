import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get userId from query parameter
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    let fastapiResponse;
    try {
      fastapiResponse = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/py/recommendations?userID=${userId}`);
    } catch (error) {
      console.error('Failed to connect to recommendations service:', error);
      return NextResponse.json({ 
        error: 'Recommendations service is unavailable. Please ensure the FastAPI server is running on port 8000.'
      }, { status: 503 });
    }

    if (!fastapiResponse.ok) {
      console.error('Recommendations service error:', await fastapiResponse.text());
      return NextResponse.json({ 
        error: `Failed to fetch user recommendations: ${fastapiResponse.statusText}`
      }, { status: fastapiResponse.status });
    }

    const response = await fastapiResponse.json();
    const recommendedUserIds: string[] = response.recommendedUserIDs;

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
      return NextResponse.json({ error: 'Profiles not found' }, { status: 404 });
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