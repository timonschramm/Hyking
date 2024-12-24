import { ActivityCardProps } from '../../types/ActivityCardProps';
import {
  easeIn,
  motion,
  PanInfo,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
const Card = ({ data, active, removeCard }: ActivityCardProps) => {
  const [exitX, setExitX] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -125, 0, 125, 200], [0, 1, 1, 1, 0]);

  const dragEnd = (
    e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x > 100) {
      setExitX(200);
      setDirection('right');
      removeCard(data.id, 'right');
    } else if (info.offset.x < -100) {
      setExitX(-200);
      setDirection('left');
      removeCard(data.id, 'left');
    }
  };

  return (
    <>
      {active ? (
        <Dialog>
          <DialogTrigger asChild>
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              className="card absolute z-30 flex h-[90%] w-[90%] items-center justify-center self-center md:h-[438px] md:w-[289px] dark:bg-primary dark:text-primary-white cursor-pointer"
              onDragEnd={dragEnd}
              initial={{ scale: 0.95, opacity: 0.5 }}
              animate={{
                scale: 1.05,
                opacity: 1,
              }}
              style={{ x, rotate, opacity }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeIn' }}
              whileDrag={{ cursor: 'grabbing' }}
              exit={{ x: exitX }}
            >
              <div className="no-scrollbar rounded-2xl relative h-full w-full overflow-hidden bg-background-white dark:bg-primary">
                <div className="relative h-[70%] w-full">
                  <Image
                    src={`https://img.oastatic.com/img2/${data.primaryImageId}/default/variant.jpg`}
                    fill
                    alt={data.title}
                    className="object-cover"
                    priority
                  />
                </div>
                
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                  <h2 className="text-xl font-semibold mb-2">{data.title}</h2>
                  <div className="flex items-center gap-2 text-sm">
                    <span>{data.primaryRegion}</span>
                    <span>•</span>
                    <span>{data.length}m</span>
                    <span>•</span>
                    <span>{data.difficulty}</span>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: x.get() > 100 ? 1 : 0,
                    scale: x.get() > 100 ? 1 : 0.5,
                  }}
                  className="absolute right-4 top-4 z-50 rounded-full bg-green-500/80 p-2"
                >
                  <Check className="h-8 w-8 text-white" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: x.get() < -100 ? 1 : 0,
                    scale: x.get() < -100 ? 1 : 0.5,
                  }}
                  className="absolute left-4 top-4 z-50 rounded-full bg-red-500/80 p-2"
                >
                  <X className="h-8 w-8 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">{data.title}</h2>
              
              <p className="text-primary-medium dark:text-primary-white">
                {data.teaserText}
              </p>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-secondary-sage dark:bg-primary-white px-3 py-1 text-xs text-primary dark:text-primary">
                  Difficulty: {data.difficulty}
                </span>
                <span className="rounded-full bg-secondary-sage dark:bg-primary-white px-3 py-1 text-xs text-primary dark:text-primary">
                  ↑ {data.ascent}m
                </span>
                <span className="rounded-full bg-secondary-sage dark:bg-primary-white px-3 py-1 text-xs text-primary dark:text-primary">
                  ↓ {data.descent}m
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">Details</h3>
                <div className="space-y-2 text-sm">
                  <p>Duration: {Math.round(data.durationMin / 60)} hours</p>
                  <p>Max Altitude: {data.maxAltitude}m</p>
                  <p>Region: {data.primaryRegion}</p>
                  {data.publicTransportFriendly && (
                    <p className="text-teal-700">Public Transport Friendly</p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
};

export default Card;