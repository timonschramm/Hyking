import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
console.log(Object.keys(prisma));export async function GET(req: NextRequest) {
  try {
    const hikes = await prisma.activity.findMany({
      take: 10,
      include: {
        category: true,
        images: true,
      },
    });
    // console.log("hikes: " + JSON.stringify(hikes, null, 2));
    return NextResponse.json(hikes);
  } catch (error) {
    console.log("error: " + error)
    return NextResponse.json({ error: 'Failed to fetch hikes, error: ' + error }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}