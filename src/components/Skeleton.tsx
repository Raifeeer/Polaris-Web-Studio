import React from "react";

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", children }) => {
  return (
    <div className={`bg-[var(--color-border-subtle)] rounded animate-pulse ${className}`}>
      {children}
    </div>
  );
};

export default Skeleton;
