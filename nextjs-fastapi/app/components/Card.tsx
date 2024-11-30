import { CardProps } from '../../types/Cardprops';
import {
  easeIn,
  motion,
  PanInfo,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

const Card = ({ data, active, removeCard }: CardProps) => {
  const [exitX, setExitX] = useState(0);

  const x = useMotionValue(0);
  const input = [-200, 0, 200];
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -125, 0, 125, 200], [0, 1, 1, 1, 0]);

  const dragEnd = (
    e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x > 100) {
      setExitX(200);
      removeCard(data.id, 'right');
    } else if (info.offset.x < -100) {
      setExitX(-200);
      removeCard(data.id, 'left');
    }
  };

  return (
    <>
      {active ? (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          className="card absolute z-30 flex h-[438px] w-[289px] items-center justify-center self-center"
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
          <div className="no-scrollbar scrollCards absolute m-auto h-[calc(100%-20px)] w-[calc(100%-20px)] overflow-y-scroll rounded-xl bg-white/10 backdrop-blur-lg">
            <div className="card-image-wrapper relative h-[269px] w-full overflow-hidden">
              <Image
                src={data.src}
                fill
                alt=""
                className="object-cover"
                priority
              />
            </div>
            
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">{data.name}</h2>
                <span className="rounded-full bg-white/20 px-3 py-1 text-sm text-white">{data.age}</span>
              </div>

              <p className="text-sm text-white/80">{data.bio}</p>

              <div className="flex flex-wrap gap-2">
                {data.genre.map((item, idx) => (
                  <span 
                    key={idx} 
                    className="rounded-full bg-teal-900/60 px-3 py-1 text-xs text-teal-100"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium text-white">Top Tracks</h3>
                <div className="grid grid-cols-2 gap-3">
                  {data.tracks.map((track, id) => (
                    <div key={id} className="group relative">
                      <Image 
                        src={track.img}
                        width={100}
                        height={100}
                        alt=""
                        className="rounded-lg transition-all hover:opacity-80"
                      />
                      <div className="mt-2">
                        <p className="text-sm font-medium text-white">{track.name}</p>
                        <p className="text-xs text-white/60">{track.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </>
  );
};

export default Card;