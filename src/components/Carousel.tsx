import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import "./Carousel.css";

export type CarouselItemBase = {
  id: string | number;
  title: string;
  description?: ReactNode;
};

type CarouselProps<T extends CarouselItemBase> = {
  items: T[];
  baseWidth?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  round?: boolean;
  itemHeight?: number;
  className?: string;
  renderItem?: (item: T, index: number) => ReactNode;
  onItemClick?: (item: T, index: number) => void;
};

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const GAP = 16;
const SPRING_OPTIONS = { type: "spring", stiffness: 300, damping: 30 } as const;
type CarouselTransition = typeof SPRING_OPTIONS | { duration: number };

function CarouselItem<T extends CarouselItemBase>({
  item,
  index,
  itemWidth,
  itemHeight,
  round,
  trackItemOffset,
  x,
  transition,
  renderItem,
  onClick,
}: {
  item: T;
  index: number;
  itemWidth: number;
  itemHeight?: number;
  round: boolean;
  trackItemOffset: number;
  x: MotionValue<number>;
  transition: CarouselTransition;
  renderItem?: (item: T, index: number) => ReactNode;
  onClick?: () => void;
}) {
  const range = [
    -(index + 1) * trackItemOffset,
    -index * trackItemOffset,
    -(index - 1) * trackItemOffset,
  ];
  const rotateY = useTransform(x, range, [90, 0, -90], { clamp: false });

  return (
    <motion.div
      className={`carousel-item ${round ? "round" : ""}`}
      style={{
        width: itemWidth,
        height: round ? itemWidth : itemHeight ?? "100%",
        rotateY,
        ...(round && { borderRadius: "50%" }),
      }}
      transition={transition}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {renderItem ? (
        renderItem(item, index)
      ) : (
        <div className="carousel-item-fallback">
          <div className="carousel-item-title">{item.title}</div>
          {item.description && (
            <p className="carousel-item-description">{item.description}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function Carousel<T extends CarouselItemBase>({
  items,
  baseWidth = 300,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false,
  round = false,
  itemHeight,
  className = "",
  renderItem,
  onItemClick,
}: CarouselProps<T>) {
  const containerPadding = 16;
  const itemWidth = baseWidth - containerPadding * 2;
  const trackItemOffset = itemWidth + GAP;
  const itemsForRender = useMemo(() => {
    if (!loop || items.length === 0) return items;
    return [items[items.length - 1], ...items, items[0]];
  }, [items, loop]);

  const [position, setPosition] = useState(loop ? 1 : 0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pauseOnHover || !containerRef.current) return undefined;
    const container = containerRef.current;
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);
    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [pauseOnHover]);

  useEffect(() => {
    if (!autoplay || itemsForRender.length <= 1 || (pauseOnHover && isHovered)) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setPosition((previous) => Math.min(previous + 1, itemsForRender.length - 1));
    }, autoplayDelay);
    return () => window.clearInterval(timer);
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, itemsForRender.length]);

  useEffect(() => {
    const startingPosition = loop ? 1 : 0;
    setPosition(startingPosition);
    x.set(-startingPosition * trackItemOffset);
  }, [items.length, loop, trackItemOffset, x]);

  useEffect(() => {
    if (!loop && position > itemsForRender.length - 1) {
      setPosition(Math.max(0, itemsForRender.length - 1));
    }
  }, [itemsForRender.length, loop, position]);

  const effectiveTransition = isJumping ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationComplete = () => {
    if (!loop || itemsForRender.length <= 1) {
      setIsAnimating(false);
      return;
    }
    const lastCloneIndex = itemsForRender.length - 1;
    if (position === lastCloneIndex) {
      setIsJumping(true);
      const target = 1;
      setPosition(target);
      x.set(-target * trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }
    if (position === 0) {
      setIsJumping(true);
      const target = items.length;
      setPosition(target);
      x.set(-target * trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }
    setIsAnimating(false);
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const { offset, velocity } = info;
    const direction =
      offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESHOLD
        ? 1
        : offset.x > DRAG_BUFFER || velocity.x > VELOCITY_THRESHOLD
          ? -1
          : 0;
    if (direction === 0) return;
    setPosition((previous) => {
      const next = previous + direction;
      const max = itemsForRender.length - 1;
      return Math.max(0, Math.min(next, max));
    });
  };

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * Math.max(itemsForRender.length - 1, 0),
          right: 0,
        },
      };

  const activeIndex =
    items.length === 0
      ? 0
      : loop
        ? (position - 1 + items.length) % items.length
        : Math.min(position, items.length - 1);

  const containerStyle: CSSProperties = {
    width: `${baseWidth}px`,
    ...(itemHeight ? { height: `${itemHeight + 58}px` } : {}),
    ...(round && { height: `${baseWidth}px`, borderRadius: "50%" }),
  };

  return (
    <div
      ref={containerRef}
      className={`carousel-container ${round ? "round" : ""} ${className}`.trim()}
      style={containerStyle}
      aria-label="Project carousel"
    >
      <motion.div
        className="carousel-track"
        drag={isAnimating ? false : "x"}
        {...dragProps}
        style={{
          width: itemWidth,
          gap: `${GAP}px`,
          perspective: 1000,
          perspectiveOrigin: `${position * trackItemOffset + itemWidth / 2}px 50%`,
          x,
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(position * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationStart={() => setIsAnimating(true)}
        onAnimationComplete={handleAnimationComplete}
      >
        {itemsForRender.map((item, index) => (
          <CarouselItem
            key={`${item.id}-${index}`}
            item={item}
            index={index}
            itemWidth={itemWidth}
            itemHeight={itemHeight}
            round={round}
            trackItemOffset={trackItemOffset}
            x={x}
            transition={effectiveTransition}
            renderItem={renderItem}
            onClick={
              onItemClick ? () => onItemClick(item, activeIndex) : undefined
            }
          />
        ))}
      </motion.div>
      <div className={`carousel-indicators-container ${round ? "round" : ""}`}>
        <div className="carousel-indicators" role="tablist" aria-label="Projects">
          {items.map((item, index) => (
            <motion.button
              type="button"
              key={item.id}
              className={`carousel-indicator ${activeIndex === index ? "active" : "inactive"}`}
              aria-label={`Go to ${item.title}`}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => setPosition(loop ? index + 1 : index)}
              animate={{ scale: activeIndex === index ? 1.2 : 1 }}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
