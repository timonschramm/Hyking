
import { Prisma } from '@prisma/client';

export type UserInterestWithInterest = Prisma.UserInterestGetPayload<{
  include: {
    interest: true;
  };
}>;
