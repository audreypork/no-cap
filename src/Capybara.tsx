import React from 'react';
import capyImg from './assets/capy.png';

type Variant = 'sleeping' | 'awake' | 'happy';

type Props = {
  width: number;
  variant?: Variant;
  flipX?: boolean;
};

// Intrinsic dimensions of the source PNG, used to maintain aspect ratio.
export const CAPY_SRC_W = 592;
export const CAPY_SRC_H = 316;
export const CAPY_ASPECT = CAPY_SRC_W / CAPY_SRC_H;

export function Capybara({ width, variant = 'awake', flipX = false }: Props) {
  const height = width / CAPY_ASPECT;
  return (
    <img
      src={capyImg}
      width={width}
      height={height}
      alt="capybara"
      draggable={false}
      style={{
        display: 'block',
        userSelect: 'none',
        pointerEvents: 'none',
        transform: flipX ? 'scaleX(-1)' : undefined,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))',
      }}
    />
  );
}
