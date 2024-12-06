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
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          className="card z-30 flex h-full w-full items-center justify-center self-center md:h-[438px] md:w-[289px]"
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
          <div className="no-scrollbar rounded-lg scrollCards absolute m-auto h-full w-full overflow-y-scroll bg-white/10 backdrop-blur-lg md:h-[calc(100%-20px)] md:w-[calc(100%-20px)] md:rounded-xl">
            <div className="card-image-wrapper relative h-[50vh] w-full overflow-hidden" >
              <div className="relative h-full w-full">
                <Image
                  src={`https://img.oastatic.com/img2/${data.primaryImageId}/default/variant.jpg`}
                  fill
                  alt={data.title}
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            
            <div className="space-y-4 p-8 md:p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">{data.title}</h2>
                <span className="rounded-full bg-white/20 px-3 py-1 text-sm text-white">
                  {data.length}km
                </span>
              </div>

              <p className="text-sm text-white/80">{data.teaserText}</p>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-teal-900/60 px-3 py-1 text-xs text-teal-100">
                  Difficulty: {data.difficulty}
                </span>
                <span className="rounded-full bg-teal-900/60 px-3 py-1 text-xs text-teal-100">
                  ↑ {data.ascent}m
                </span>
                <span className="rounded-full bg-teal-900/60 px-3 py-1 text-xs text-teal-100">
                  ↓ {data.descent}m
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium text-white">Details</h3>
                <div className="space-y-2 text-sm text-white/80">
                  <p>Duration: {Math.round(data.durationMin / 60)} hours</p>
                  <p>Max Altitude: {data.maxAltitude}m</p>
                  <p>Region: {data.primaryRegion}</p>
                  {data.publicTransportFriendly && (
                    <p className="text-teal-100"> Public Transport Friendly</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <>
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
          </>
        </motion.div>
      ) : null}
    </>
  );
};

export default Card;