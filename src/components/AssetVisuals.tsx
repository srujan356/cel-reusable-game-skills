import React from 'react';
import { AssetItem } from '../types/platform';

export const RewardTokenGlyph: React.FC<{
  kind: AssetItem['visualKind'] | 'missing';
  size?: number;
  className?: string;
}> = ({ kind, size = 28, className = '' }) => {
  if (kind === 'missing') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" className={className} fill="none">
        <rect x="3" y="3" width="26" height="26" rx="4" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M12 12L20 20M20 12L12 20" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  switch (kind) {
    case 'flowers':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" className={className} fill="none">
          <circle cx="18" cy="9" r="5.5" fill="#F472B6" stroke="#DB2777" strokeWidth="1.2" />
          <circle cx="26.5" cy="15" r="5.5" fill="#F472B6" stroke="#DB2777" strokeWidth="1.2" />
          <circle cx="23.5" cy="25" r="5.5" fill="#FB7185" stroke="#DB2777" strokeWidth="1.2" />
          <circle cx="12.5" cy="25" r="5.5" fill="#FB7185" stroke="#DB2777" strokeWidth="1.2" />
          <circle cx="9.5" cy="15" r="5.5" fill="#F472B6" stroke="#DB2777" strokeWidth="1.2" />
          <circle cx="18" cy="18" r="5.2" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.4" />
          <circle cx="16.5" cy="16.5" r="1.5" fill="#FEF08A" />
        </svg>
      );
    case 'candies':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" className={className} fill="none">
          <path d="M4 11L11 18L4 25L6 18L4 11Z" fill="#C084FC" stroke="#7E22CE" strokeWidth="1.2" />
          <path d="M32 11L25 18L32 25L30 18L32 11Z" fill="#C084FC" stroke="#7E22CE" strokeWidth="1.2" />
          <circle cx="18" cy="18" r="8.5" fill="#A855F7" stroke="#6B21A8" strokeWidth="1.5" />
          <path d="M13 13C15.5 11.5 20.5 11.5 23 13" stroke="#F3E8FF" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 18H24" stroke="#E9D5FF" strokeWidth="1.5" strokeDasharray="2 2" />
        </svg>
      );
    case 'cookies':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" className={className} fill="none">
          <circle cx="18" cy="18" r="11" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
          <circle cx="18" cy="18" r="9.2" fill="#F59E0B" />
          <circle cx="14" cy="14" r="1.8" fill="#451A03" />
          <circle cx="21" cy="13" r="1.5" fill="#451A03" />
          <circle cx="22" cy="20" r="1.9" fill="#451A03" />
          <circle cx="15" cy="22" r="1.6" fill="#451A03" />
          <circle cx="18" cy="17.5" r="1.4" fill="#451A03" />
        </svg>
      );
    case 'chocolates':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" className={className} fill="none">
          <path d="M7 22L10 28H26L29 22H7Z" fill="#FBBF24" stroke="#B45309" strokeWidth="1.2" />
          <path d="M9 22C9 14 13 10 18 10C23 10 27 14 27 22H9Z" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
          <path d="M14 14C16 12.5 20 12.5 22 15" stroke="#D97706" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'coins':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" className={className} fill="none">
          <circle cx="18" cy="18" r="11.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1.6" />
          <circle cx="18" cy="18" r="8.8" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
          <path d="M18 12.5L20.5 18L18 23.5L15.5 18L18 12.5Z" fill="#FEF08A" stroke="#B45309" strokeWidth="1" />
        </svg>
      );
  }
};

export const AssetThumbnailGraphic: React.FC<{
  visualKind: AssetItem['visualKind'];
  accentColor?: string;
}> = ({ visualKind, accentColor = '#D97706' }) => {
  switch (visualKind) {
    case 'chest_gold':
      return (
        <svg width="56" height="48" viewBox="0 0 64 52" fill="none">
          {/* Base Hull */}
          <rect x="10" y="24" width="44" height="22" rx="2" fill={accentColor} stroke="#78350F" strokeWidth="1.5" />
          <rect x="10" y="24" width="6" height="22" fill="#FBBF24" />
          <rect x="48" y="24" width="6" height="22" fill="#FBBF24" />
          {/* Lid */}
          <path
            d="M8 24C8 14 15 10 32 10C49 10 56 14 56 24H8Z"
            fill={accentColor}
            stroke="#78350F"
            strokeWidth="1.5"
          />
          <path d="M14 11V24M50 11V24" stroke="#FBBF24" strokeWidth="4" />
          {/* Lock Plate */}
          <rect x="27" y="19" width="10" height="11" rx="2" fill="#FDE047" stroke="#92400E" strokeWidth="1.4" />
          <circle cx="32" cy="24.5" r="1.6" fill="#78350F" />
          {/* Hinge Pivot Indicator */}
          <circle cx="55" cy="24" r="3" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1" />
        </svg>
      );
    case 'chest_wood_static':
      return (
        <svg width="56" height="48" viewBox="0 0 64 52" fill="none">
          <rect x="14" y="10" width="36" height="34" rx="2" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
          <path d="M14 18H50M14 27H50M14 36H50" stroke="#451A03" strokeWidth="1.4" />
          <path d="M16 12L48 42M48 12L16 42" stroke="#92400E" strokeWidth="2.5" />
          <rect x="20" y="21" width="24" height="11" rx="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" />
          <text x="32" y="29" textAnchor="middle" fill="#92400E" fontSize="7" fontWeight="700" fontFamily="monospace">
            1 MESH
          </text>
        </svg>
      );
    case 'gift_box':
      return (
        <svg width="56" height="48" viewBox="0 0 64 52" fill="none">
          <rect x="14" y="22" width="36" height="24" rx="2" fill="#2563EB" stroke="#1E40AF" strokeWidth="1.5" />
          <rect x="11" y="15" width="42" height="8" rx="1.5" fill="#3B82F6" stroke="#1E40AF" strokeWidth="1.5" />
          <rect x="29" y="15" width="6" height="31" fill="#FACC15" />
          <path d="M32 15C26 7 19 9 23 15C27 15 32 15 32 15Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.2" />
          <path d="M32 15C38 7 45 9 41 15C37 15 32 15 32 15Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.2" />
        </svg>
      );
    case 'particles_burst':
    case 'sparkles':
      return (
        <svg width="56" height="48" viewBox="0 0 64 52" fill="none">
          <circle cx="32" cy="26" r="5" fill="#FDE047" />
          <path
            d="M32 8V16M32 36V44M14 26H22M42 26H50M19 13L25 19M39 33L45 39M45 13L39 19M25 33L19 39"
            stroke="#F59E0B"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="18" cy="18" r="2" fill="#FBBF24" />
          <circle cx="46" cy="16" r="2.2" fill="#FBBF24" />
          <circle cx="47" cy="36" r="1.8" fill="#FBBF24" />
        </svg>
      );
    case 'confetti':
      return (
        <svg width="56" height="48" viewBox="0 0 64 52" fill="none">
          <rect x="16" y="12" width="6" height="3" transform="rotate(25 16 12)" fill="#EC4899" />
          <rect x="34" y="10" width="7" height="3" transform="rotate(-18 34 10)" fill="#10B981" />
          <rect x="44" y="22" width="6" height="3" transform="rotate(40 44 22)" fill="#3B82F6" />
          <rect x="22" y="28" width="7" height="3" transform="rotate(-32 22 28)" fill="#F59E0B" />
          <rect x="38" y="34" width="6" height="3" transform="rotate(15 38 34)" fill="#8B5CF6" />
          <path d="M26 16C30 22 26 28 31 36" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 20C22 26 17 32 21 40" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'audio_wave':
      return (
        <svg width="56" height="48" viewBox="0 0 64 52" fill="none">
          <path
            d="M10 26V26M15 19V33M20 12V40M25 21V31M30 15V37M35 9V43M40 17V35M45 22V30M50 18V34M55 24V28"
            stroke="#0284C7"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'character_rig':
      return (
        <svg width="56" height="48" viewBox="0 0 64 52" fill="none">
          <circle cx="32" cy="11" r="4.5" stroke="#DC2626" strokeWidth="1.8" fill="#FEE2E2" />
          <path d="M32 16V29M32 19L21 24M32 19L43 15M32 29L23 43M32 29L46 28" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="19" r="2" fill="#2563EB" />
          <circle cx="32" cy="29" r="2" fill="#2563EB" />
          <circle cx="46" cy="28" r="2.2" fill="#F59E0B" />
        </svg>
      );
    default:
      return <RewardTokenGlyph kind={visualKind} size={38} />;
  }
};
