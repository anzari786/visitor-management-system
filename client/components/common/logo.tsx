import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function Logo({
  className = '',
  width = 36,
  height = 36,
}: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Image
        src="/image.png"
        alt="ATI Logo"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
    </div>
  );
}