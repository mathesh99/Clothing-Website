interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function LoadingSpinner({ size = 'md', color = 'velour-black' }: LoadingSpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div
      className={`${sizes[size]} border-2 border-velour-light-grey border-t-${color} rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}
