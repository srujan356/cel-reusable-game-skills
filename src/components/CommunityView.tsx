import React, { useState } from 'react';
import { BadgeCheck, GitFork, GitPullRequest } from 'lucide-react';
import { SkillCardItem } from '../types/platform';
import { Avatar, Button, Pill, cx } from './ui';

interface CommunityViewProps {
  skill: SkillCardItem;
  onOpenSkillDetail: (skillId: string) => void;
  onOpenPlayground: (skillId: string) => void;
  onCreateFork: () => void;
}

const FORKS = [
  { name: 'spring-blossom-reveal', by: 'Sora Takahashi', from: '1.1.0', note: 'Flowers + confetti', verified: true },
  { name: 'idempotent-chest-reveal', by: 'Marcus Chen', from: '1.1.0', note: 'Merged upstream in 1.1.1', merged: true },
  { name: 'celestial-giftbox-unbox', by: 'Devon Brooks', from: '1.1.1', note: 'Gift box + chocolates', verified: true },
];

export const CommunityView: React.FC<CommunityViewProps> = ({ skill, onOpenSkillDetail, onCreateFork }) => {
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState([
    { who: 'Marcus Chen', tag: 'Edge case', status: 'Merged', body: 'Skip during collection could send a second request on slow networks. Added a lock keyed by reward ID.' },
    { who: 'Sora Takahashi', tag: 'Variant', status: 'Verified', body: 'Added a Flowers reward variant and a reduced-motion crossfade.' },
    { who: 'Devon Brooks', tag: 'Proposal', status: 'Open', body: 'Warn when a chest uses a baked texture without a color parameter.' },
  ]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1100px] mx-auto px-10 py-8">
        <div className="rounded-2xl bg-white border border-line p-7 flex items-center gap-6">
          <Avatar name="Elena Vance" size={64} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-semibold tracking-tight">Elena Vance</h1>
              <BadgeCheck className="w-5 h-5 text-accent" />
            </div>
            <div className="text-[13.5px] text-muted mt-0.5">Technical Artist · Chaos Engine Core</div>
          </div>
          <div className="flex gap-8 text-center">
            {[
              ['4', 'Skills'],
              ['49', 'Forks'],
              ['20', 'Integrations'],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="text-[20px] font-semibold tabular-nums">{v}</div>
                <div className="text-[12px] text-muted">{l}</div>
              </div>
            ))}
          </div>
          <Button variant="primary" icon={<GitFork className="w-3.5 h-3.5" />} onClick={onCreateFork}>
            Fork
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 mt-6">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-line p-6">
              <div className="text-[14px] font-semibold mb-5">Fork lineage</div>
              <button type="button" onClick={() => onOpenSkillDetail(skill.id)} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-night text-left cursor-pointer">
                <span className="w-8 h-8 rounded-lg bg-accent/20 text-[#84adff] flex items-center justify-center">
                  <GitFork className="w-4 h-4" />
                </span>
                <div className="flex-1">
                  <div className="text-[13.5px] font-semibold text-white">reward-reveal</div>
                  <div className="text-[12px] text-white/45">Original · Elena Vance</div>
                </div>
                <span className="text-[12px] font-mono text-white/50">v{skill.latestVersion}</span>
              </button>
              <div className="ml-7 border-l border-line-2 pl-6 pt-3 space-y-3">
                {FORKS.map((f) => (
                  <div key={f.name} className="relative flex items-center gap-3 p-3 rounded-xl border border-line">
                    <span className="absolute -left-6 top-1/2 w-6 h-px bg-line-2" />
                    <Avatar name={f.by} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium font-mono truncate">{f.name}</div>
                      <div className="text-[12px] text-muted">
                        {f.by} · from v{f.from} · {f.note}
                      </div>
                    </div>
                    {f.verified && <Pill tone="success">Verified</Pill>}
                    {f.merged && <Pill tone="accent">Merged</Pill>}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-line p-6">
              <div className="text-[14px] font-semibold mb-4">Verified in games</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Crown & Cascade', 'Puzzle RPG · v1.1.1'],
                  ['Bloom Haven', 'Casual sim · fork 1.0.0'],
                ].map(([n, d]) => (
                  <div key={n} className="p-4 rounded-xl bg-subtle">
                    <div className="flex items-center gap-1.5 text-[13.5px] font-medium">
                      {n} <BadgeCheck className="w-3.5 h-3.5 text-[#12b76a]" />
                    </div>
                    <div className="text-[12px] text-muted mt-0.5">{d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-line p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[14px] font-semibold">Versions</span>
                <Pill tone="warning">Demo data</Pill>
              </div>
              <div className="space-y-3">
                {skill.versions.map((v, i) => (
                  <div key={v.version} className="flex items-start gap-3">
                    <span className={cx('mt-1.5 w-2 h-2 rounded-full', i === 0 ? 'bg-accent' : 'bg-line-2')} />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-[13px] font-mono font-medium">v{v.version}</span>
                        <span className="text-[11.5px] text-faint">{v.date}</span>
                      </div>
                      <div className="text-[12.5px] text-muted">{v.summary}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-line p-6">
              <div className="text-[14px] font-semibold mb-4">Contributions</div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!note.trim()) return;
                  setFeedback([{ who: 'Elena Vance', tag: 'Note', status: 'Open', body: note.trim() }, ...feedback]);
                  setNote('');
                }}
                className="flex gap-2 mb-4"
              >
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Suggest an improvement" className="flex-1 h-9 px-3 rounded-lg border border-line-2 text-[13px] outline-none focus:border-accent focus:ring-3 focus:ring-accent/15" />
                <Button type="submit" variant="primary" className="h-9">
                  Send
                </Button>
              </form>
              <div className="space-y-4">
                {feedback.map((f, i) => (
                  <div key={i} className="flex gap-3">
                    <Avatar name={f.who} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">{f.who}</span>
                        <span className="text-[11.5px] text-muted">{f.tag}</span>
                        <span className="ml-auto">
                          <Pill tone={f.status === 'Merged' ? 'accent' : f.status === 'Verified' ? 'success' : 'neutral'}>
                            {f.status === 'Merged' && <GitPullRequest className="w-3 h-3" />}
                            {f.status}
                          </Pill>
                        </span>
                      </div>
                      <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed">{f.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
