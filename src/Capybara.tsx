import React from 'react';
import capyImg from './assets/capy.png';
import capyWalkImg from './assets/capy-walk.png';

type Variant = 'sleeping' | 'awake' | 'happy' | 'walking';

type Props = {
  width: number;
  variant?: Variant;
  /**
   * Horizontal flip. Both source PNGs face LEFT natively, so
   * flipX=true makes the capybara face RIGHT.
   */
  flipX?: boolean;
};

// Intrinsic dimensions of the static capy PNG.
export const CAPY_SRC_W = 592;
export const CAPY_SRC_H = 316;
export const CAPY_ASPECT = CAPY_SRC_W / CAPY_SRC_H;

// Walking sprite sheet: 4 frames laid out horizontally.
// Per-frame intrinsic size from the cropped strip.
const WALK_FRAMES = 4;
const WALK_FRAME_W = 360;
const WALK_FRAME_H = 261;
export const CAPY_WALK_ASPECT = WALK_FRAME_W / WALK_FRAME_H;
const WALK_DURATION_MS = 480;

export function Capybara({ width, variant = 'awake', flipX = false }: Props) {
  if (variant === 'walking') {
    return <WalkingCapybara width={width} flipX={flipX} />;
  }
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

function WalkingCapybara({ width, flipX }: { width: number; flipX: boolean }) {
  const height = width / CAPY_WALK_ASPECT;
  const stripWidth = width * WALK_FRAMES;
  return (
    <div
      style={{
        width,
        height,
        overflow: 'hidden',
        transform: flipX ? 'scaleX(-1)' : undefined,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))',
      }}
    >
      <img
        src={capyWalkImg}
        width={stripWidth}
        height={height}
        alt="capybara walking"
        draggable={false}
        style={{
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
          animation: `walkCycle ${WALK_DURATION_MS}ms steps(${WALK_FRAMES}) infinite`,
        }}
      />
    </div>
  );
}
