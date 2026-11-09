/** The crescent that has caught the one orange dot. */
export default function Mark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M17.9 2.63A13.5 13.5 0 1 0 28.91 19.94A10.5 10.5 0 1 1 17.9 2.63Z" />
      <circle cx="21" cy="13" r="3.2" fill="#FC734D" />
    </svg>
  );
}
