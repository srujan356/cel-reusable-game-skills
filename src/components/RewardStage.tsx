import React from 'react';
import { AssetItem, PreviewInteractionState, TrajectoryType } from '../types/platform';
import { AssetThumbnailGraphic, RewardTokenGlyph } from './AssetVisuals';

type Kind = AssetItem['visualKind'] | 'missing';

interface RewardStageProps {
  state: PreviewInteractionState;
  rewardKind: Kind;
  containerKind?: AssetItem['visualKind'] | null;
  lidOpen?: boolean;
  chestColor?: string;
  trajectory?: TrajectoryType;
  arcHeight?: number;
  quantity?: number;
  intensity?: number;
  glow?: number;
  lidAngle?: number;
  scale?: number;
  openDurationMs?: number;
  reducedMotion?: boolean;
  noDestination?: boolean;
  wallet?: number;
  onChestClick?: () => void;
}

const START = { x: 200, y: 124 };
const END = { x: 468, y: 56 };

export function pointAt(type: TrajectoryType, t: number, h: number) {
  const { x: x0, y: y0 } = START;
  const { x: x1, y: y1 } = END;
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const mt = 1 - t;
  switch (type) {
    case 'Straight':
      return { x: lerp(x0, x1), y: lerp(y0, y1) };
    case 'Bezier': {
      const c1 = { x: x0 + 50, y: y0 - h * 1.1 };
      const c2 = { x: x1 - 110, y: y1 - h * 0.7 };
      return {
        x: mt ** 3 * x0 + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t ** 3 * x1,
        y: mt ** 3 * y0 + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t ** 3 * y1,
      };
    }
    case 'Wave':
      return { x: lerp(x0, x1), y: lerp(y0, y1) - Math.sin(t * Math.PI * 3) * h * 0.28 };
    case 'Custom': {
      const pts = [START, { x: 280, y: 64 }, { x: 370, y: 96 }, END];
      const seg = Math.min(2, Math.floor(t * 3));
      const lt = t * 3 - seg;
      return { x: pts[seg].x + (pts[seg + 1].x - pts[seg].x) * lt, y: pts[seg].y + (pts[seg + 1].y - pts[seg].y) * lt };
    }
    case 'Arc':
    default: {
      const c = { x: (x0 + x1) / 2, y: Math.min(y0, y1) - h };
      return { x: mt * mt * x0 + 2 * mt * t * c.x + t * t * x1, y: mt * mt * y0 + 2 * mt * t * c.y + t * t * y1 };
    }
  }
}

export function trajectoryPath(type: TrajectoryType, h: number) {
  let d = '';
  for (let i = 0; i <= 48; i++) {
    const p = pointAt(type, i / 48, h);
    d += `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
  }
  return d;
}

const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2;
  const r = 46 + (i % 3) * 16;
  return { x: 200 + Math.cos(a) * r, y: 128 + Math.sin(a) * r * 0.7, d: (i % 5) * 0.18, s: 0.7 + (i % 3) * 0.3 };
});

export function RewardStage({
  state,
  rewardKind,
  containerKind = 'chest_gold',
  lidOpen,
  chestColor = '#D97706',
  trajectory = 'Arc',
  arcHeight = 110,
  quantity = 6,
  intensity = 80,
  glow = 1.2,
  lidAngle = 115,
  scale = 1,
  openDurationMs = 520,
  reducedMotion,
  noDestination,
  wallet,
  onChestClick,
}: RewardStageProps) {
  const open = lidOpen ?? ['Opening', 'Revealed', 'Collecting', 'Completed'].includes(state);
  const revealed = ['Revealed', 'Collecting', 'Completed'].includes(state) || (state === 'Error' && open);
  const n = Math.max(0, Math.min(quantity, 6));
  const h = arcHeight * 0.55;
  const sparkCount = reducedMotion ? 0 : Math.round((intensity / 100) * SPARKS.length);
  const ease = reducedMotion ? 'opacity .2s' : 'transform .75s cubic-bezier(.22,1,.36,1), opacity .4s';

  const tokenPos = (i: number) => {
    const fountain = { x: START.x + (i - (n - 1) / 2) * 24, y: START.y - 34 - (i % 2) * 14 };
    if (!revealed) return { ...START, o: 0 };
    if (noDestination || state === 'Revealed' || state === 'Error') return { ...fountain, o: 1 };
    if (state === 'Collecting') {
      const p = pointAt(trajectory, Math.min(0.92, 0.32 + i * 0.11), h);
      return { ...p, o: 1 };
    }
    return { ...END, o: 0 };
  };

  return (
    <svg viewBox="0 0 600 250" preserveAspectRatio="xMidYMid meet" className="w-full h-full select-none">
      <defs>
        <radialGradient id="rs-glow">
          <stop offset="0%" stopColor="#fbd36b" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fbd36b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rs-shade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
      </defs>

      {/* path */}
      {!noDestination && (
        <path
          d={trajectoryPath(trajectory, h)}
          fill="none"
          stroke={state === 'Collecting' ? 'rgba(96,140,255,0.7)' : 'rgba(255,255,255,0.12)'}
          strokeWidth="1.5"
          strokeDasharray="4 5"
          style={{ transition: 'stroke .3s' }}
        />
      )}

      {/* destination */}
      {!noDestination && (
        <g style={{ transform: state === 'Completed' ? 'scale(1.04)' : 'none', transformBox: 'fill-box', transformOrigin: 'center', transition: 'transform .3s' }}>
          <rect x="446" y="38" width="104" height="36" rx="10" fill="rgba(255,255,255,0.05)" stroke={state === 'Completed' ? 'rgba(18,183,106,0.6)' : 'rgba(255,255,255,0.1)'} />
          <g transform="translate(456 44)">
            <RewardTokenGlyph kind={rewardKind} size={24} />
          </g>
          <text x="488" y="61" fill="#fff" fontSize="14" fontWeight="600" fontFamily="JetBrains Mono, monospace">
            {wallet ?? 120}
          </text>
        </g>
      )}

      {/* glow */}
      <circle cx="200" cy="122" r="110" fill="url(#rs-glow)" style={{ opacity: revealed ? Math.min(1, glow / 1.6) : 0, transition: 'opacity .5s' }} />
      <ellipse cx="200" cy="214" rx={92 * scale} ry="12" fill="rgba(0,0,0,0.45)" />
      <ellipse cx="200" cy="214" rx={70 * scale} ry="7" fill="rgba(47,107,255,0.18)" />

      {/* container */}
      <g
        onClick={onChestClick}
        className={onChestClick ? 'cursor-pointer' : undefined}
        style={{ transform: `scale(${scale})`, transformBox: 'fill-box', transformOrigin: '50% 100%', transition: 'transform .3s' }}
      >
        {containerKind === 'chest_wood_static' || containerKind === 'gift_box' ? (
          <g transform="translate(140 118) scale(1.9)">
            <AssetThumbnailGraphic visualKind={containerKind} />
          </g>
        ) : (
          <g transform="translate(140 118)">
            <rect x="0" y="40" width="120" height="56" rx="7" fill={chestColor} />
            <rect x="0" y="40" width="120" height="56" rx="7" fill="url(#rs-shade)" />
            <rect x="14" y="40" width="11" height="56" fill="#f6c453" opacity="0.92" />
            <rect x="95" y="40" width="11" height="56" fill="#f6c453" opacity="0.92" />
            <rect x="0" y="40" width="120" height="56" rx="7" fill="none" stroke="rgba(0,0,0,0.35)" />
            <g
              style={{
                transformBox: 'fill-box',
                transformOrigin: '100% 100%',
                transform: open ? `rotate(${-Math.min(40, (Math.abs(lidAngle) / 115) * 30)}deg) translateY(-8px)` : 'none',
                transition: reducedMotion ? 'none' : `transform ${openDurationMs}ms cubic-bezier(.34,1.56,.64,1)`,
              }}
            >
              <path d="M0 42 C0 16 20 6 60 6 C100 6 120 16 120 42 Z" fill={chestColor} />
              <path d="M0 42 C0 16 20 6 60 6 C100 6 120 16 120 42 Z" fill="url(#rs-shade)" />
              <path d="M14 13 V42 M106 13 V42" stroke="#f6c453" strokeWidth="11" opacity="0.92" />
              <path d="M0 42 C0 16 20 6 60 6 C100 6 120 16 120 42 Z" fill="none" stroke="rgba(0,0,0,0.35)" />
              <rect x="52" y="32" width="16" height="18" rx="3.5" fill="#fde68a" stroke="#92400e" strokeWidth="1.2" />
              <circle cx="60" cy="41" r="2" fill="#92400e" />
            </g>
          </g>
        )}
        {state === 'Closed' && onChestClick && (
          <text x="200" y="240" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="Inter, sans-serif">
            Tap the chest
          </text>
        )}
      </g>

      {/* sparkles */}
      {(state === 'Opening' || state === 'Revealed') &&
        SPARKS.slice(0, sparkCount).map((s, i) => (
          <g key={i} transform={`translate(${s.x} ${s.y}) scale(${s.s})`}>
            <path className="twinkle" style={{ animationDelay: `${s.d}s` }} d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2Z" fill="#fde68a" />
          </g>
        ))}

      {/* reward tokens */}
      {Array.from({ length: n }).map((_, i) => {
        const p = tokenPos(i);
        return (
          <g
            key={i}
            style={{
              transform: `translate(${p.x - 13}px, ${p.y - 13}px)`,
              opacity: p.o,
              transition: ease,
              transitionDelay: revealed ? `${i * 40}ms` : '0ms',
            }}
          >
            <RewardTokenGlyph kind={rewardKind} size={26} />
          </g>
        );
      })}
    </svg>
  );
}
