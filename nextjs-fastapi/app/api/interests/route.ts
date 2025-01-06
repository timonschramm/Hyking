import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const interests = await prisma.interest.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    
    // console.log('Fetched interests:', interests);
    
    // Group interests by category
    const groupedInterests = interests.reduce((acc, interest) => {
      const category = interest.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(interest);
      return acc;
    }, {} as Record<string, typeof interests>);

    // console.log('Grouped interests:', groupedInterests);
    return NextResponse.json(groupedInterests);
  } catch (error) {
    console.error('Error fetching interests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interests' },
      { status: 500 }
    );
  }
} 