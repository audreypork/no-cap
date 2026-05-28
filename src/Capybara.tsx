import React from 'react';

type Variant = 'sleeping' | 'awake' | 'happy';

type Props = {
  width: number;
  variant?: Variant;
  flipX?: boolean;
};

export function Capybara({ width, variant = 'awake', flipX = false }: Props) {
  const height = (width * 55) / 115;
  return (
    <svg
      viewBox="0 0 115 55"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      style={{
        display: 'block',
        transform: flipX ? 'scaleX(-1)' : undefined,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
      }}
    >
      <ellipse cx="16" cy="42" rx="7" ry="2.5" fill="#8C6B47" />
      <ellipse cx="26" cy="44" rx="7" ry="3" fill="#A4815C" />
      <ellipse cx="46" cy="28" rx="30" ry="15" fill="#B89072" />
      <ellipse cx="46" cy="38" rx="22" ry="5" fill="#CAA487" />
      <ellipse cx="80" cy="22" rx="17" ry="14" fill="#B89072" />
      <ellipse cx="72" cy="10" rx="4.5" ry="5.5" fill="#8C6B47" />
      <ellipse cx="72.5" cy="11" rx="2.5" ry="3.2" fill="#5C4129" />
      <path d="M82 27 Q92 23 96 28 Q92 33 82 31 Z" fill="#A4815C" />
      {variant === 'sleeping' ? (
        <path
          d="M82.5 18.2 Q84 19.4 85.6 18.2"
          stroke="#2A1A0A"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <>
          <ellipse cx="84" cy="18" rx="2" ry="2.4" fill="#2A1A0A" />
          <circle cx="84.6" cy="17.4" r="0.7" fill="#FFFFFF" />
        </>
      )}
      <ellipse cx="97" cy="27" rx="2" ry="1.5" fill="#2A1A0A" />
      {variant === 'happy' ? (
        <path
          d="M90 31 Q93 35 96 31"
          stroke="#5C4129"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M91 31 Q93 33 95 31.5"
          stroke="#5C4129"
          strokeWidth="0.8"
          fill="none"
          strokeLinecap="round"
        />
      )}
      <ellipse cx="100" cy="36" rx="15" ry="3" fill="#8C6B47" />
      <ellipse cx="102" cy="32" rx="14" ry="2.8" fill="#A4815C" />
      <ellipse cx="113" cy="36" rx="2" ry="1.5" fill="#3D2818" />
      <ellipse cx="115" cy="32" rx="2" ry="1.5" fill="#3D2818" />
    </svg>
  );
}
