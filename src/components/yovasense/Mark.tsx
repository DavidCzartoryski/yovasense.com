/**
 * The YovaSense logo: David's YS tile (navy to blue to cyan, an orange glow in
 * one corner), corners rounded. Files in public/brand/, made by `npm run brand`;
 * `sizes` lets the browser take the file that matches `size` at 1x, 2x or 3x.
 * Decorative (`alt=""`): the link around it names YovaSense.
 */
const SRC_SET = [24, 26, 48, 52, 72, 78].map((px) => `/brand/ys-logo-${px}.webp ${px}w`).join(", ");

export default function Mark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export, images unoptimized
    <img
      src="/brand/ys-logo-26.webp"
      srcSet={SRC_SET}
      sizes={`${size}px`}
      width={size}
      height={size}
      alt=""
      className={className}
    />
  );
}
