import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular' }) => {
  const baseStyles = 'bg-zinc-200 animate-pulse';
  const variantStyles = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded h-4 w-full mb-2',
  };

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      aria-hidden="true"
    />
  );
};

export default Skeleton;
