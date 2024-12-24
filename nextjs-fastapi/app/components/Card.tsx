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
  const [isDragging, setIsDragging] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -125, 0, 125, 200], [0, 1, 1, 1, 0]);
  
  const leftIndicatorOpacity = useTransform(
    x,
    [-150, -25, 0],
    [1, 0.5, 0]
  );
  const rightIndicatorOpacity = useTransform(
    x,
    [0, 25, 150],
    [0, 0.5, 1]
  );
  const indicatorScale = useTransform(
    x,
    [-150, -100, 0, 100, 150],
    [1, 0.8, 0.5, 0.8, 1]
  );

  const leftIndicatorX = useTransform(
    x,
    [-200, -150, -100, -50, 0],
    [100, 50, 0, -40, -20],
    { ease: easeIn }
  );
  const rightIndicatorX = useTransform(
    x,
    [0, 50, 100, 150, 200],
    [-20, -40, 0, 50, 100],
    { ease: easeIn }
  );

  const dragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
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

  const handleAction = (direction: 'left' | 'right') => {
    setDirection(direction);
    setExitX(direction === 'left' ? -200 : 200);
    removeCard(data.id, direction);
  };

  return (
    <div className="absolute flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.95, opacity: 0.5 }}
        animate={{ scale: 1.05, opacity: 1 }}
        exit={{ 
          x: exitX,
          opacity: 0,
          transition: { duration: 0.2 }
        }}
      >
        {active ? (
          <Dialog>
            <DialogTrigger asChild>
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                onDragStart={() => setIsDragging(true)}
                onClick={(e) => {
                  if (isDragging) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                className="card-image-wrapper card relative z-30 h-[70vh] w-[90vw] md:h-[438px] md:w-[289px] dark:bg-primary dark:text-primary-white cursor-pointer"
                onDragEnd={dragEnd}
                style={{ x, rotate, opacity }}
                transition={{ type: 'tween', duration: 0.2 }}
                whileDrag={{ cursor: 'grabbing' }}
              >
                <div className="no-scrollbar rounded-2xl relative h-full w-full overflow-hidden bg-background-white dark:bg-primary">
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center z-50"
                    style={{ 
                      opacity: rightIndicatorOpacity, 
                      scale: indicatorScale,
                      x: rightIndicatorX 
                    }}
                  >
                    <div className="rounded-full bg-green-500/90 p-4">
                      <Check className="h-12 w-12 text-white" />
                    </div>
                  </motion.div>

                  <motion.div
                    className="absolute inset-0 flex items-center justify-center z-50"
                    style={{ 
                      opacity: leftIndicatorOpacity, 
                      scale: indicatorScale,
                      x: leftIndicatorX 
                    }}
                  >
                    <div className="rounded-full bg-red-500/90 p-4">
                      <X className="h-12 w-12 text-white" />
                    </div>
                  </motion.div>

                  <div className="relative h-full w-full">
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
      </motion.div>

      {active && (
        <div className="pt-6 z-40 flex gap-8">
          <button
            onClick={() => handleAction('left')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/80 text-white transition-transform hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            onClick={() => handleAction('right')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/80 text-white transition-transform hover:scale-110"
          >
            <Check className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Card;