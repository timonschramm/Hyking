import { Prisma } from '@prisma/client';

export type ProfileWithInterests = Prisma.ProfileGetPayload<{
  include: {
    interests: {
      include: {
        interest: true
      }
    }
  }
}>; 