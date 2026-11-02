import React, { useMemo, useState } from 'react';
import { ArrowRight, GitFork, Search, X } from 'lucide-react';
import { PRIMARY_BUCKETS } from '../data/mockData';
import { CompatibilityStatus, PrimaryBucket, SkillCardItem } from '../types/platform';
import { AssetThumbnailGraphic, RewardTokenGlyph } from './AssetVisuals';
import { RewardStage } from './RewardStage';
import { MyWorkSubFilter } from './TopBar';
import { Avatar, Button, Dot, cx } from './ui';

interface SkillLibraryViewProps {
  skills: SkillCardItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  myWorkFilter: MyWorkSubFilter;
  onOpenSkillDetail: (skillId: string) => void;
  onOpenPlayground: (skillId: string) => void;
  onForkSkill: (skillId: string) => void;
  activeRewardVisualKind: 'coins' | 'flowers' | 'candies' | 'cookies' | 'chocolates';
}

export const compat = (c: CompatibilityStatus) =>
  ({
    Compatible: { label: 'Compatible', tone: 'success' },
    'Compatible with configuration': { label: 'Needs config', tone: 'accent' },
    'Requires mapping': { label: 'Needs mapping', tone: 'warning' },
    'Requires additional integration': { label: 'Needs integration', tone: 'warning' },
    Unsupported: { label: 'Unsupported', tone: 'danger' },
  })[c];

export function SkillPreview({ kind, reward }: { kind: SkillCardItem['previewVisual']; reward: SkillLibraryViewProps['activeRewardVisualKind'] }) {
  switch (kind) {
    case 'reward_reveal':
      return (
        <div className="flex items-end gap-3">
          <div className="scale-[1.4] origin-bottom">
            <AssetThumbnailGraphic visualKind="chest_gold" />
          </div>
          <div className="flex flex-col gap-1 -mb-1 floaty">
            <RewardTokenGlyph kind={reward} size={22} />
            <div className="ml-3">
              <RewardTokenGlyph kind={reward} size={18} />
            </div>
          </div>
        </div>
      );
    case 'tap_select':
      return (
        <div className="flex items-center gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cx('w-11 h-11 rounded-xl border', i === 1 ? 'bg-accent/25 border-accent -translate-y-2 shadow-[0_8px_20px_-6px_rgba(47,107,255,0.6)]' : 'bg-white/[0.04] border-white/10')} />
          ))}
        </div>
      );
    case 'button_feedback':
      return (
        <div className="relative">
          <div className="h-10 px-6 rounded-xl bg-[#f04438]/15 border border-[#f04438]/40 text-[#fda29b] text-[13px] font-medium flex items-center">Invalid move</div>
          <span className="absolute -left-4 top-1/2 w-2.5 h-px bg-[#fda29b]/50" />
          <span className="absolute -right-4 top-1/2 w-2.5 h-px bg-[#fda29b]/50" />
        </div>
      );
    case 'tile_merge':
      return (
        <div className="flex items-center gap-2 text-white/40 text-[13px]">
          <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/70 font-semibold">2</div>+
          <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/70 font-semibold">2</div>
          <ArrowRight className="w-3.5 h-3.5" />
          <div className="w-12 h-12 rounded-xl bg-[#12b76a]/20 border border-[#12b76a]/50 flex items-center justify-center text-[#6ce9a6] font-semibold text-[16px]">4</div>
        </div>
      );
    case 'hint_hand':
      return (
        <svg width="150" height="70" viewBox="0 0 150 70">
          <path d="M15 55 C 50 0, 100 0, 135 40" fill="none" stroke="rgba(253,176,34,0.6)" strokeWidth="2" strokeDasharray="4 5" />
          <circle cx="15" cy="55" r="6" fill="rgba(255,255,255,0.15)" />
          <circle cx="135" cy="40" r="11" fill="rgba(253,176,34,0.2)" stroke="#fdb022" strokeWidth="1.5" />
        </svg>
      );
    case 'streak_bar':
      return (
        <div className="w-44">
          <div className="h-2.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-accent to-[#84adff]" />
          </div>
          <div className="flex justify-between mt-2 text-[10.5px] text-white/40">
            <span>×1</span>
            <span>×2</span>
            <span className="text-white/80">×3</span>
            <span>×5</span>
          </div>
        </div>
      );
    case 'level_victory':
    default:
      return (
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <svg key={i} width={i === 1 ? 38 : 28} height={i === 1 ? 38 : 28} viewBox="0 0 24 24" className={i === 1 ? '-translate-y-2' : ''}>
              <path d="M12 2l3 6.5 7 .9-5.1 4.8 1.3 7L12 17.8 5.8 21.2l1.3-7L2 9.4l7-.9z" fill="#fdb022" />
            </svg>
          ))}
        </div>
      );
  }
}

export const SkillLibraryView: React.FC<SkillLibraryViewProps> = ({ skills, searchQuery, onSearchChange, myWorkFilter, onOpenSkillDetail, onOpenPlayground, onForkSkill, activeRewardVisualKind }) => {
  const [bucket, setBucket] = useState<PrimaryBucket | 'ALL'>('ALL');
  const [tags, setTags] = useState<string[]>([]);

  const topTags = useMemo(() => {
    const count: Record<string, number> = {};
    skills.forEach((s) => s.tags.forEach((t) => (count[t] = (count[t] || 0) + 1)));
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([t]) => t);
  }, [skills]);

  const filtered = useMemo(
    () =>
      skills.filter((s) => {
        if (myWorkFilter === 'my_skills' && s.creator !== 'Elena Vance') return false;
        if (bucket !== 'ALL' && s.primaryBucket !== bucket) return false;
        if (tags.length && !tags.every((t) => s.tags.includes(t))) return false;
        const q = searchQuery.trim().toLowerCase();
        if (q) return [s.name, s.shortDescription, s.primaryBucket, s.creator, ...s.tags].some((v) => v.toLowerCase().includes(q));
        return true;
      }),
    [skills, bucket, tags, searchQuery, myWorkFilter]
  );

  const featured = skills.find((s) => s.id === 'reward-reveal')!;
  const showHero = (bucket === 'ALL' || bucket === 'Rewards & Collection') && !searchQuery && !tags.length && myWorkFilter !== 'my_skills';
  const toggleTag = (t: string) => setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1200px] mx-auto px-10 py-8">
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{myWorkFilter === 'my_skills' ? 'My skills' : 'Skill Library'}</h1>
            <p className="text-[14px] text-muted mt-1">Complete interactions you can adapt to your own assets.</p>
          </div>
          <div className="relative w-72">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search skills"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-white border border-line-2 text-[13px] outline-none focus:border-accent focus:ring-3 focus:ring-accent/15 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {[{ id: 'ALL' as const, label: 'All' }, ...PRIMARY_BUCKETS.map((b) => ({ id: b.id, label: b.id }))].map((b) => {
            const n = b.id === 'ALL' ? skills.length : skills.filter((s) => s.primaryBucket === b.id).length;
            const on = bucket === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBucket(b.id)}
                className={cx('h-8 px-3 rounded-full text-[12.5px] font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer', on ? 'bg-ink text-white' : 'text-ink-2 hover:bg-white hover:shadow-[0_0_0_1px_var(--color-line)]')}
              >
                {b.label}
                <span className={cx('text-[11px] tabular-nums', on ? 'text-white/50' : 'text-faint')}>{n}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mt-3 mb-8">
          {topTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className={cx('h-6 px-2 rounded-md text-[11.5px] transition-colors cursor-pointer', tags.includes(t) ? 'bg-accent text-white' : 'bg-white text-muted border border-line hover:text-ink hover:border-line-2')}
            >
              #{t}
            </button>
          ))}
          {tags.length > 0 && (
            <button type="button" onClick={() => setTags([])} className="h-6 px-2 text-[11.5px] text-accent flex items-center gap-1 cursor-pointer">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {showHero && (
          <div className="rounded-2xl overflow-hidden bg-night grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] mb-10 shadow-[0_24px_60px_-24px_rgba(10,12,17,0.55)]">
            <div className="p-9 flex flex-col justify-between gap-8">
              <div>
                <div className="flex items-center gap-2 text-[12px] text-white/50">
                  <span className="text-[#fdb022]">Featured</span>
                  <span className="w-1 h-1 rounded-full bg-white/25" />
                  Rewards & Collection
                </div>
                <h2 className="text-[34px] font-semibold tracking-[-0.025em] text-white mt-3">Reward Reveal</h2>
                <p className="text-[15px] text-white/55 mt-2 max-w-md leading-relaxed">Open a container, reveal rewards, and hand collection to the host game.</p>
                <div className="flex flex-wrap gap-1.5 mt-5">
                  {['chest', 'coins', 'particles', 'skip'].map((t) => (
                    <span key={t} className="h-6 px-2 rounded-md bg-white/[0.06] text-white/60 text-[11.5px] inline-flex items-center">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <Avatar name={featured.creator} size={24} />
                  <span className="text-[13px] text-white/80">{featured.creator}</span>
                  <span className="text-[12px] text-white/35">
                    v{featured.latestVersion} · {featured.adoptedProjects} projects · {featured.forkCount} forks
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="primary" onClick={() => onOpenPlayground(featured.id)}>
                    Open in Playground
                  </Button>
                  <Button variant="night" onClick={() => onOpenSkillDetail(featured.id)}>
                    View details
                  </Button>
                  <Button variant="night" icon={<GitFork className="w-3.5 h-3.5" />} onClick={() => onForkSkill(featured.id)}>
                    Fork
                  </Button>
                </div>
              </div>
            </div>
            <div className="relative stage-night min-h-[300px] cursor-pointer" onClick={() => onOpenSkillDetail(featured.id)}>
              <div className="absolute inset-0 p-4">
                <RewardStage state="Collecting" rewardKind={activeRewardVisualKind} quantity={6} />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-[15px] font-semibold">{bucket === 'ALL' ? 'All skills' : bucket}</h3>
          <span className="text-[12.5px] text-muted">{filtered.length} results</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-line-2 bg-white">
            <div className="text-[14px] font-medium">No skills match</div>
            <p className="text-[13px] text-muted mt-1">Try another bucket or clear your filters.</p>
            <Button
              className="mt-4"
              onClick={() => {
                setBucket('ALL');
                setTags([]);
                onSearchChange('');
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((s) => {
              const c = compat(s.compatibilitySummary);
              return (
                <div
                  key={s.id}
                  onClick={() => onOpenSkillDetail(s.id)}
                  className="group rounded-2xl bg-white border border-line overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-16px_rgba(16,24,40,0.2)] hover:border-line-2"
                >
                  <div className="relative h-40 stage-night flex items-center justify-center">
                    <SkillPreview kind={s.previewVisual} reward={activeRewardVisualKind} />
                    <span className="absolute left-3 top-3 h-6 px-2 rounded-md bg-white/[0.07] text-white/60 text-[11px] inline-flex items-center backdrop-blur">{s.primaryBucket}</span>
                    <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPlayground(s.id);
                        }}
                      >
                        Import
                      </Button>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-[15px] font-semibold tracking-tight truncate">{s.name}</h4>
                      <span className="text-[11.5px] font-mono text-faint">v{s.latestVersion}</span>
                    </div>
                    <p className="text-[13px] text-muted mt-1.5 line-clamp-2 leading-relaxed">{s.shortDescription}</p>
                    <div className="flex items-center justify-between mt-5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={s.creator} size={20} />
                        <span className="text-[12.5px] text-ink-2 truncate">{s.creator}</span>
                      </div>
                      <span className="flex items-center gap-1.5 text-[12px] text-muted shrink-0">
                        <Dot tone={c.tone} />
                        {c.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
