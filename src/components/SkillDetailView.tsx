import React, { useState } from 'react';
import { ArrowLeft, BarChart3, Check, GitFork, Play, Replace, RotateCcw, SkipForward } from 'lucide-react';
import { EDGE_CASE_SCENARIOS } from '../data/mockData';
import { AssetItem, PlaygroundConfiguration, PreviewInteractionState, SkillCardItem, SkillComponentSlot } from '../types/platform';
import { RewardStage } from './RewardStage';
import { Avatar, Button, Dot, IconButton, Pill, Tabs, cx } from './ui';

interface SkillDetailViewProps {
  skill: SkillCardItem;
  components: SkillComponentSlot[];
  assets: AssetItem[];
  config: PlaygroundConfiguration;
  onBackToLibrary: () => void;
  onImportToPlayground: (version: string) => void;
  onForkSkill: () => void;
  onOpenFeedbackLearning: () => void;
  onOpenReplaceModal: () => void;
  onSelectVersion: (version: string) => void;
}

const FLOW = [
  { k: 'Trigger', v: 'On Tap · Reward Container', s: 'Closed' },
  { k: 'Composite', v: 'Open Reward Container', s: 'Opening' },
  { k: 'Response', v: 'Spawn rewards + particle burst', s: 'Revealed' },
  { k: 'Response', v: 'Move along trajectory', s: 'Revealed' },
  { k: 'Host', v: 'CollectReward(rewardId)', s: 'Collecting' },
  { k: 'Outcome', v: 'Host confirms or rejects', s: 'Completed · Error' },
];

const PROPS = [
  ['openingStyle', 'Opening style', 'Pop · Fast · Slow · Hinge'],
  ['rewardQuantity', 'Reward quantity', '1 – 50'],
  ['trajectoryType', 'Trajectory', 'Line · Arc · Bezier · Wave'],
  ['chestBaseColor', 'Container color', 'Requires _BaseColor'],
  ['playbackSpeed', 'Playback speed', '0.5× – 2.0×'],
  ['skipEnabled', 'Allow skip', 'Boolean'],
];

export const SkillDetailView: React.FC<SkillDetailViewProps> = ({ skill, components, assets, config, onBackToLibrary, onImportToPlayground, onForkSkill, onOpenFeedbackLearning, onOpenReplaceModal, onSelectVersion }) => {
  const [state, setState] = useState<PreviewInteractionState>('Closed');
  const [tab, setTab] = useState<'overview' | 'properties' | 'compatibility' | 'edge' | 'docs'>('overview');
  const reward = assets.find((a) => a.id === components.find((c) => c.id === 'reward_item')?.assignedAssetId);

  const play = () => {
    if (state !== 'Closed' && state !== 'Completed') return;
    setState('Opening');
    setTimeout(() => setState('Revealed'), 600);
    setTimeout(() => setState('Collecting'), 1300);
    setTimeout(() => setState('Completed'), 2100);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1200px] mx-auto px-10 py-7">
        <button type="button" onClick={onBackToLibrary} className="flex items-center gap-1.5 text-[13px] text-muted hover:text-ink mb-5 cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" /> Library
        </button>

        <div className="flex items-start justify-between gap-6 mb-7">
          <div>
            <div className="flex items-center gap-2 text-[12.5px] text-muted mb-2">
              {skill.primaryBucket}
              <span className="w-1 h-1 rounded-full bg-faint" />
              <span className="font-mono">{skill.id}</span>
            </div>
            <h1 className="text-[30px] font-semibold tracking-[-0.025em]">{skill.name}</h1>
            <p className="text-[14.5px] text-muted mt-1.5 max-w-xl">Present an earned reward through a container opening, then request collection from the host.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-6">
            <Button icon={<GitFork className="w-3.5 h-3.5" />} onClick={onForkSkill}>
              Fork
            </Button>
            {skill.id === 'reward-reveal' && (
              <Button icon={<BarChart3 className="w-3.5 h-3.5" />} onClick={onOpenFeedbackLearning}>
                Feedback &amp; Learning
              </Button>
            )}
            <Button variant="primary" onClick={() => onImportToPlayground(config.activeVersion)}>
              Import v{config.activeVersion}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="min-w-0">
            <div className="relative rounded-2xl overflow-hidden stage-night h-[360px]">
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <span className="h-6 px-2 rounded-md bg-white/[0.08] text-white/70 text-[11.5px] inline-flex items-center">{state}</span>
                <span className="h-6 px-2 rounded-md bg-[#f79009]/12 text-[#fdb022] text-[11.5px] inline-flex items-center">Simulated</span>
              </div>
              <div className="absolute inset-0 pt-6 pb-14">
                <RewardStage state={state} rewardKind={reward?.visualKind || 'missing'} chestColor={config.chestColorHex} trajectory={config.trajectoryType} arcHeight={config.arcHeightPx} onChestClick={play} />
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="primary" icon={<Play className="w-3 h-3 fill-current" />} onClick={play}>
                    Play
                  </Button>
                  <Button size="sm" variant="night" icon={<SkipForward className="w-3 h-3" />} onClick={() => (state === 'Opening' || state === 'Revealed') && setState('Completed')}>
                    Skip
                  </Button>
                  <IconButton night className="w-7 h-7" onClick={() => setState('Closed')} title="Reset">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </IconButton>
                </div>
                <Button size="sm" variant="night" icon={<Replace className="w-3 h-3" />} onClick={onOpenReplaceModal}>
                  {reward?.name.split(' (')[0] || 'Choose reward'}
                </Button>
              </div>
            </div>

            <Tabs
              className="mt-6"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'overview', label: 'Overview' },
                { value: 'properties', label: 'Properties' },
                { value: 'compatibility', label: 'Compatibility' },
                { value: 'edge', label: 'Edge cases' },
                { value: 'docs', label: 'Docs' },
              ]}
            />

            <div className="py-6">
              {tab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-[13px] font-semibold mb-3">Components</h3>
                    <div className="rounded-xl border border-line bg-white divide-y divide-line">
                      {components.map((c) => {
                        const a = assets.find((x) => x.id === c.assignedAssetId);
                        return (
                          <div key={c.id} className="flex items-center gap-3 px-3.5 h-11">
                            <Dot tone={a ? 'success' : c.required ? 'danger' : 'neutral'} />
                            <span className="text-[13px] flex-1">{c.name}</span>
                            {!c.required && <span className="text-[11px] text-faint">optional</span>}
                            <span className="text-[11.5px] text-muted font-mono truncate max-w-[130px]">{a?.format || '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold mb-3">Flow</h3>
                    <div className="relative pl-5">
                      <div className="absolute left-[5px] top-2 bottom-2 w-px bg-line-2" />
                      {FLOW.map((f, i) => (
                        <div key={i} className="relative pb-4 last:pb-0">
                          <span className={cx('absolute -left-5 top-1.5 w-[11px] h-[11px] rounded-full border-2 bg-white', i === 1 ? 'border-accent' : 'border-line-2')} />
                          <div className="text-[11px] text-muted">{f.k}</div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-medium">{f.v}</span>
                            <span className="text-[11px] text-muted whitespace-nowrap">{f.s}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'properties' && (
                <div className="rounded-xl border border-line bg-white divide-y divide-line">
                  {PROPS.map(([id, label, range]) => (
                    <div key={id} className="grid grid-cols-[1fr_1fr_1fr] items-center px-4 h-11 text-[13px]">
                      <span className="font-medium">{label}</span>
                      <span className="font-mono text-[12px] text-muted">{id}</span>
                      <span className="text-muted text-right">{range}</span>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'compatibility' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    ['Inputs', ['hostRewardId', 'rewardItemType', 'rewardAmount', 'reducedMotion']],
                    ['Outputs', ['onOpeningStarted', 'onRewardRevealed', 'onCollectionRequested', 'onSkipped']],
                    ['Requires', ['Schema 1.1+', 'GLB / FBX container', 'Clip or lid pivot', 'Host reward interface']],
                  ].map(([t, items]) => (
                    <div key={t as string} className="rounded-xl border border-line bg-white p-4">
                      <div className="text-[12px] font-semibold text-muted mb-3">{t as string}</div>
                      <ul className="space-y-2">
                        {(items as string[]).map((i) => (
                          <li key={i} className="text-[12.5px] font-mono flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-[#12b76a]" />
                            {i}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'edge' && (
                <div className="rounded-xl border border-line bg-white divide-y divide-line">
                  {EDGE_CASE_SCENARIOS.filter((e) => e.id !== 'normal').map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-4 px-4 py-3">
                      <span className="text-[13px] font-medium">{e.label}</span>
                      <Pill tone={e.severity.includes('Error') ? 'danger' : e.severity.includes('Warning') ? 'warning' : e.severity.includes('Recovery') ? 'accent' : 'neutral'}>{e.severity}</Pill>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'docs' && (
                <div className="max-w-2xl space-y-3 text-[14px] leading-relaxed text-ink-2">
                  <p>This skill handles presentation only. When rewards reach the destination — or the player skips — it sends one collection request and waits for the host.</p>
                  <p>The host owns eligibility and balances. Every request carries a unique reward ID, so retries never double-credit.</p>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center gap-3">
                <Avatar name={skill.creator} size={36} />
                <div>
                  <div className="text-[13.5px] font-semibold">{skill.creator}</div>
                  <div className="text-[12px] text-muted">{skill.studio}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-5 text-center">
                {[
                  [skill.adoptedProjects, 'Projects'],
                  [skill.forkCount, 'Forks'],
                  [skill.versions.length, 'Versions'],
                ].map(([v, l]) => (
                  <div key={l as string} className="rounded-lg bg-subtle py-2.5">
                    <div className="text-[16px] font-semibold tabular-nums">{v}</div>
                    <div className="text-[11px] text-muted">{l}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-5">
                {['chest', 'reward-reveal', 'coins', 'collection', 'particles', 'skip'].map((t) => (
                  <span key={t} className="h-6 px-2 rounded-md bg-subtle text-[11.5px] text-ink-2 inline-flex items-center">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="text-[13px] font-semibold mb-3">Variants</div>
              <div className="space-y-2.5 text-[12.5px]">
                {[
                  ['Container', 'Chest · Gift box · Card'],
                  ['Reward', 'Coins · Flowers · Candies +2'],
                  ['Opening', 'Pop · Fast · Slow'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <span className="text-muted">{k}</span>
                    <span className="text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-semibold">Versions</span>
                <Pill tone="warning">Demo data</Pill>
              </div>
              <div className="relative">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-line" />
                {skill.versions.map((v) => {
                  const on = v.version === config.activeVersion;
                  return (
                    <button key={v.version} type="button" onClick={() => onSelectVersion(v.version)} className="relative w-full text-left pl-6 pb-4 last:pb-0 cursor-pointer group">
                      <span className={cx('absolute left-0 top-1 w-[11px] h-[11px] rounded-full border-2', on ? 'bg-accent border-accent' : 'bg-white border-line-2 group-hover:border-muted')} />
                      <div className="flex items-center justify-between">
                        <span className={cx('text-[13px] font-mono', on ? 'text-accent font-medium' : 'text-ink')}>v{v.version}</span>
                        <span className="text-[11px] text-faint">{v.date}</span>
                      </div>
                      <div className="text-[12.5px] text-muted mt-0.5">{v.summary}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
