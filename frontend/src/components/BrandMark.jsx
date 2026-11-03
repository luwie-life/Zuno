
import { Link } from 'react-router-dom';

export function BrandIcon({ light = false, size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Zuno"
      className={`shrink-0 ${className}`}
    >
      <circle
        cx="24"
        cy="24"
        r="23"
        fill={light ? '#FFFFFF' : '#0B3D2E'}
      />
      <path
        d="M14 14H34L20.5 24H34L14 34H34"
        stroke={light ? '#0B3D2E' : '#D7F36A'}
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandWordmark({
  light = false,
  size = 36,
  className = '',
}) {
  return (
    <Link
      to="/"
      aria-label="Zuno home"
      className={`inline-flex items-center gap-2.5 no-underline ${className}`}
    >
      <BrandIcon light={light} size={size} />
      <span
        className={`font-display text-2xl font-bold tracking-tight ${
          light ? 'text-white' : 'text-forest'
        }`}
      >
        Zuno
      </span>
    </Link>
  );
}
