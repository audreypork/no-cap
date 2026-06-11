import React from 'react';
import capyImg from './assets/capy.png';
import capyWalkImg from './assets/capy-walk.png';
import capyCheerImg from './assets/capy-cheer.png';

type Variant = 'sleeping' | 'awake' | 'happy' | 'walking' | 'cheering';

type Props = {
  width: number;
  variant?: Variant;
  /** flipX=true means the capybara should face RIGHT. */
  flipX?: boolean;
};

// Intrinsic dimensions of the static capy PNG.
export const CAPY_SRC_W = 640;
export const CAPY_SRC_H = 328;
export const CAPY_ASPECT = CAPY_SRC_W / CAPY_SRC_H;

// Sprite sheets: 4 frames laid out horizontally, per-frame intrinsic
// size from the cropped strips. facesRight notes the native direction
// of the art so flipX can be normalized.
const SHEETS = {
  walking: { img: capyWalkImg, frames: 4, w: 360, h: 261, facesRight: false },
  cheering: { img: capyCheerImg, frames: 4, w: 400, h: 308, facesRight: true },
} as const;

export const CAPY_WALK_ASPECT = SHEETS.walking.w / SHEETS.walking.h;
export const CAPY_CHEER_ASPECT = SHEETS.cheering.w / SHEETS.cheering.h;
const WALK_DURATION_MS = 480;

export function Capybara({ width, variant = 'awake', flipX = false }: Props) {
  if (variant === 'walking' || variant === 'cheering') {
    return <SpriteCapybara width={width} faceRight={flipX} sheet={SHEETS[variant]} />;
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

function SpriteCapybara({
  width,
  faceRight,
  sheet,
}: {
  width: number;
  faceRight: boolean;
  sheet: (typeof SHEETS)[keyof typeof SHEETS];
}) {
  const height = width / (sheet.w / sheet.h);
  const stripWidth = width * sheet.frames;
  const mirrored = sheet.facesRight ? !faceRight : faceRight;
  return (
    <div
      style={{
        width,
        height,
        overflow: 'hidden',
        transform: mirrored ? 'scaleX(-1)' : undefined,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))',
      }}
    >
      <img
        src={sheet.img}
        width={stripWidth}
        height={height}
        alt="capybara walking"
        draggable={false}
        style={{
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
          animation: `walkCycle ${WALK_DURATION_MS}ms steps(${sheet.frames}) infinite`,
        }}
      />
    </div>
  );
}
