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

    const fastapiResponse = await fetch(`http://127.0.0.1:8000/api/recommendations?userID=${params.userId}`);

    
    if (!fastapiResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch user recommendations' }, { status: fastapiResponse.status });
    }

    const response = await fastapiResponse.json();
    const recommendedUserId = response.recommendedUserID;

    console.log("recommendedUserId: " + recommendedUserId)
    const recommendedProfile = await prisma.profile.findUnique({
      where: { id: recommendedUserId },
      
    });

    if (!recommendedProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(recommendedUserId);
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    return NextResponse.json({ error: 'Failed to process recommendation' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}