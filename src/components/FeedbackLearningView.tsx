import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Code2,
  GitBranch,
  Lightbulb,
  PackageCheck,
  PlayCircle,
  ShieldCheck,
  Timer,
  Users,
  Wrench,
} from 'lucide-react';
import { SkillCardItem } from '../types/platform';
import { Button, Pill, cx } from './ui';

type StageId =
  | 'shipped'
  | 'events'
  | 'analytics'
  | 'insights'
  | 'investigation'
  | 'decision'
  | 'improvement'
  | 'version'
  | 'validation'
  | 'more-games';

type MetricKey =
  | 'started'
  | 'completed'
  | 'skipped'
  | 'interrupted'
  | 'requested'
  | 'succeeded'
  | 'failed'
  | 'assetFailed'
  | 'duration';

type GameSample = {
  name: string;
  context: string;
  reward: string;
  tone: string;
  metrics: Record<MetricKey, string>;
};

type EventDefinition = {
  name: string;
  fires: string;
  properties: string[];
  context: string;
  outcome: string;
};

const FLOW_STAGES: { id: StageId; label: string; short: string; description: string }[] = [
  { id: 'shipped', label: 'Shipped Games', short: 'Three contexts', description: 'Reward Reveal runs in different games with different reward pacing, art, and player expectations.' },
  { id: 'events', label: 'Interaction Events', short: 'Contracted signals', description: 'The skill defines the moments worth observing without collecting personal information.' },
  { id: 'analytics', label: 'Analytics', short: 'Compare patterns', description: 'Illustrative event counts are grouped by game and skill version for comparison.' },
  { id: 'insights', label: 'Insights', short: 'Find the gap', description: 'A large difference in skip rate becomes a question for the team to investigate.' },
  { id: 'investigation', label: 'Investigation', short: 'Team review', description: 'Analytics, Product, Engineering, LiveOps, and Marketing each contribute a different lens.' },
  { id: 'decision', label: 'Product Decision', short: 'Scope the cause', description: 'The team decides whether the issue belongs to the shared skill, Game B configuration, assets, or runtime.' },
  { id: 'improvement', label: 'Skill Improvement', short: 'Make it tunable', description: 'The proposed change optimizes timing and exposes a configurable reveal-timing property.' },
  { id: 'version', label: 'New Skill Version', short: 'Propose v1.2', description: 'The improvement is recorded as a proposed version and does not overwrite the verified v1.1 behavior.' },
  { id: 'validation', label: 'Validation', short: 'Compare safely', description: 'The candidate is compared with the previous version across games before adoption.' },
  { id: 'more-games', label: 'More Shipped Games', short: 'Continue learning', description: 'Validated improvements return to shipped games, where the next feedback cycle begins.' },
];

const GAMES: GameSample[] = [
  {
    name: 'Game A',
    context: 'Calm word puzzle',
    reward: 'Small coin reward',
    tone: 'bg-[#e8f0ff] text-[#2459e6]',
    metrics: { started: '1,000', completed: '940', skipped: '12%', interrupted: '18', requested: '940', succeeded: '921', failed: '19', assetFailed: '3', duration: '540 ms' },
  },
  {
    name: 'Game B',
    context: 'High-energy match-3',
    reward: 'Treasure chest',
    tone: 'bg-[#fff4db] text-[#b54708]',
    metrics: { started: '1,000', completed: '820', skipped: '65%', interrupted: '74', requested: '820', succeeded: '785', failed: '35', assetFailed: '12', duration: '1,180 ms' },
  },
  {
    name: 'Game C',
    context: 'Tile puzzle',
    reward: 'Quick collection',
    tone: 'bg-[#e8f8ef] text-[#067647]',
    metrics: { started: '1,000', completed: '960', skipped: '18%', interrupted: '24', requested: '960', succeeded: '948', failed: '12', assetFailed: '5', duration: '620 ms' },
  },
];

const METRICS: { key: MetricKey; label: string; definition: string }[] = [
  { key: 'started', label: 'Reveal started', definition: 'A valid interaction begins the Reward Reveal presentation.' },
  { key: 'completed', label: 'Reveal completed', definition: 'The presentation reaches its completed visual state.' },
  { key: 'skipped', label: 'Animation skipped', definition: 'The player or host fast-forwards the presentation.' },
  { key: 'interrupted', label: 'Interaction interrupted', definition: 'The interaction is backgrounded, interrupted, or restored from a saved state.' },
  { key: 'requested', label: 'Collection requested', definition: 'The skill asks the host to validate and credit the reward.' },
  { key: 'succeeded', label: 'Collection succeeded', definition: 'The host confirms the reward was credited.' },
  { key: 'failed', label: 'Collection failed', definition: 'The host rejects or cannot complete the collection request.' },
  { key: 'assetFailed', label: 'Asset loading failed', definition: 'A referenced reward or container asset could not load.' },
  { key: 'duration', label: 'Animation duration', definition: 'Illustrative elapsed time for the reveal animation.' },
];

const EVENTS: EventDefinition[] = [
  { name: 'reward_reveal_started', fires: 'When a valid trigger starts the presentation.', properties: ['trigger', 'reward_type', 'reward_quantity', 'opening_style'], context: 'skill_id, skill_version, game_id, game_version, session_context, interaction_id', outcome: 'started' },
  { name: 'reward_reveal_completed', fires: 'When the reveal reaches its completed visual state.', properties: ['duration_ms', 'reduced_motion', 'opening_style'], context: 'skill_id, skill_version, game_id, game_version, session_context, interaction_id', outcome: 'completed' },
  { name: 'reward_reveal_skipped', fires: 'When the player or host skips the presentation.', properties: ['elapsed_ms', 'skip_source', 'state_before_skip'], context: 'skill_id, skill_version, game_id, game_version, session_context, interaction_id', outcome: 'skipped' },
  { name: 'reward_reveal_interrupted', fires: 'When the interaction is interrupted or restored.', properties: ['state', 'elapsed_ms', 'recovery_path'], context: 'skill_id, skill_version, game_id, game_version, session_context, interaction_id', outcome: 'interrupted' },
  { name: 'reward_collection_requested', fires: 'When the skill sends the host collection request.', properties: ['reward_id', 'reward_type', 'reward_quantity'], context: 'skill_id, skill_version, game_id, game_version, session_context, interaction_id', outcome: 'requested' },
  { name: 'reward_collection_succeeded', fires: 'When the host confirms collection.', properties: ['reward_id', 'credit_latency_ms'], context: 'skill_id, skill_version, game_id, game_version, session_context, interaction_id', outcome: 'succeeded' },
  { name: 'reward_collection_failed', fires: 'When the host rejects or times out the request.', properties: ['reward_id', 'failure_reason', 'retryable'], context: 'skill_id, skill_version, game_id, game_version, session_context, interaction_id', outcome: 'failed' },
  { name: 'reward_asset_load_failed', fires: 'When a referenced asset cannot be loaded.', properties: ['asset_role', 'asset_id', 'failure_reason', 'fallback_used'], context: 'skill_id, skill_version, game_id, game_version, session_context, interaction_id', outcome: 'asset_load_failed' },
];

const TEAM_REVIEW = [
  ['Analytics', 'Identifies the skip-rate difference and checks whether it is consistent across cohorts and versions.'],
  ['Product', 'Investigates whether the animation feels too long, repetitive, or mismatched to the moment.'],
  ['Engineering', 'Checks animation performance, loading behavior, frame time, and device limitations.'],
  ['LiveOps', 'Checks whether reward configuration, event conditions, or campaign timing influence behavior.'],
  ['Marketing', 'Considers campaign or player-expectation signals only when relevant to the observed change.'],
];

const DECISION_ROWS = [
  ['Reusable Reward Reveal skill', 'Same pattern across games or versions', 'Candidate for a shared timing property or lifecycle improvement'],
  ['Game B configuration', 'Only Game B has a long duration or unusual skip rule', 'Tune Game B without changing the shared skill'],
  ['Assets or animation', 'A specific chest clip, asset, or loading path is implicated', 'Optimize or replace the asset'],
  ['Runtime or device performance', 'Interruptions and duration correlate with device/runtime conditions', 'Fix runtime constraints or add a safe fallback'],
];

const VALIDATION_ROWS = [
  ['Skip rate', '65%', 'Target lower than Game B baseline without forcing identical pacing'],
  ['Completion rate', '82%', 'Should improve or remain stable'],
  ['Collection success rate', '95.7%', 'Must not regress; host authority remains unchanged'],
  ['Performance', '1,180 ms', 'Compare duration and asset loading across device classes'],
  ['Interruption rate', '7.4%', 'Should decrease or remain within the game-specific baseline'],
];

interface FeedbackLearningViewProps {
  skill: SkillCardItem;
  onBack: () => void;
}

export const FeedbackLearningView: React.FC<FeedbackLearningViewProps> = ({ skill, onBack }) => {
  const [selectedStageId, setSelectedStageId] = useState<StageId>('shipped');
  const [selectedEventName, setSelectedEventName] = useState(EVENTS[0].name);
  const selectedStage = useMemo(() => FLOW_STAGES.find((stage) => stage.id === selectedStageId) || FLOW_STAGES[0], [selectedStageId]);
  const selectedEvent = EVENTS.find((event) => event.name === selectedEventName) || EVENTS[0];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1240px] mx-auto px-10 py-8">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-muted hover:text-ink mb-5 cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" /> Reward Reveal details
        </button>

        <div className="flex items-start justify-between gap-6 mb-7">
          <div>
            <div className="flex items-center gap-2 text-[12px] text-muted mb-2">
              <span className="text-accent font-medium">{skill.name}</span>
              <span className="w-1 h-1 rounded-full bg-faint" />
              <span>Product workflow</span>
            </div>
            <h1 className="text-[30px] font-semibold tracking-[-0.025em]">Feedback &amp; Learning</h1>
            <p className="text-[14.5px] text-muted mt-1.5 max-w-2xl">How interaction information from shipped games becomes an insight, a decision, a reusable skill improvement, and the next validation cycle.</p>
          </div>
          <Pill tone="warning">Illustrative / Simulated Data</Pill>
        </div>

        <div className="rounded-2xl bg-night text-white p-6 mb-7 shadow-[0_24px_60px_-24px_rgba(10,12,17,0.55)]">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-white/50"><GitBranch className="w-3.5 h-3.5 text-[#84adff]" /> The learning loop</div>
              <h2 className="text-[21px] font-semibold mt-2">Shipped Games → Better Skill Decisions</h2>
              <p className="text-[13px] text-white/55 mt-1.5 max-w-2xl">Select a stage to inspect what happens there. This is a product-design demonstration, not live telemetry.</p>
            </div>
            <BarChart3 className="w-7 h-7 text-white/35 shrink-0" />
          </div>
          <div className="flex gap-2 overflow-x-auto mt-6 pb-1">
            {FLOW_STAGES.map((stage, index) => {
              const active = selectedStageId === stage.id;
              return (
                <React.Fragment key={stage.id}>
                  <button type="button" onClick={() => setSelectedStageId(stage.id)} className={cx('min-w-[112px] text-left rounded-xl border px-3 py-2.5 transition-colors cursor-pointer', active ? 'bg-white text-ink border-white' : 'bg-white/[0.05] border-white/10 text-white/75 hover:bg-white/[0.1]')}>
                    <div className={cx('text-[10px] font-mono', active ? 'text-accent' : 'text-white/35')}>{String(index + 1).padStart(2, '0')}</div>
                    <div className="text-[12px] font-medium mt-1 leading-tight">{stage.label}</div>
                    <div className={cx('text-[10.5px] mt-1', active ? 'text-muted' : 'text-white/45')}>{stage.short}</div>
                  </button>
                  {index < FLOW_STAGES.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-white/25 shrink-0 self-center" />}
                </React.Fragment>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 flex items-start gap-3">
            <PlayCircle className="w-4 h-4 text-[#84adff] mt-0.5 shrink-0" />
            <div><div className="text-[12.5px] font-medium">{selectedStage.label}</div><div className="text-[12px] text-white/55 mt-0.5">{selectedStage.description}</div></div>
          </div>
        </div>

        <section className="mb-8">
          <div className="flex items-end justify-between gap-4 mb-3">
            <div><h2 className="text-[18px] font-semibold">Three shipped game contexts</h2><p className="text-[12.5px] text-muted mt-1">Same reusable skill, different player expectations and configurations.</p></div>
            <Pill tone="warning">All values simulated</Pill>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GAMES.map((game) => (
              <div key={game.name} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex items-center justify-between gap-3"><span className={cx('w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-semibold', game.tone)}>{game.name.replace('Game ', '')}</span><span className="text-[11.5px] text-muted">Reward Reveal v1.1</span></div>
                <h3 className="text-[14px] font-semibold mt-4">{game.context}</h3>
                <p className="text-[12.5px] text-muted mt-1">{game.reward}</p>
                <div className="grid grid-cols-2 gap-2 mt-4"><div className="rounded-lg bg-subtle p-2.5"><div className="text-[10.5px] text-muted">Skip rate</div><div className="text-[17px] font-semibold tabular-nums mt-0.5">{game.metrics.skipped}</div></div><div className="rounded-lg bg-subtle p-2.5"><div className="text-[10.5px] text-muted">Completed</div><div className="text-[17px] font-semibold tabular-nums mt-0.5">{game.metrics.completed}</div></div></div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-line flex items-start justify-between gap-4"><div><h2 className="text-[18px] font-semibold">Illustrative interaction metrics</h2><p className="text-[12.5px] text-muted mt-1">Definitions make the numbers meaningful; they are not real player telemetry.</p></div><Timer className="w-5 h-5 text-muted" /></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-subtle"><tr><th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">Metric</th>{GAMES.map((game) => <th key={game.name} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{game.name}</th>)}</tr></thead><tbody className="divide-y divide-line">{METRICS.map((metric) => <tr key={metric.key}><td className="px-5 py-3 align-top"><div className="text-[12.5px] font-medium">{metric.label}</div><div className="text-[11px] text-muted mt-0.5 max-w-[300px]">{metric.definition}</div></td>{GAMES.map((game) => <td key={game.name} className="px-4 py-3 align-top text-[13px] font-mono tabular-nums text-ink-2">{game.metrics[metric.key]}</td>)}</tr>)}</tbody></table></div>
        </section>

        <section className="mb-8">
          <div className="flex items-end justify-between gap-4 mb-3"><div><h2 className="text-[18px] font-semibold">From observation to improvement</h2><p className="text-[12.5px] text-muted mt-1">One example of how a cross-functional team avoids guessing.</p></div><Pill tone="accent">Example decision path</Pill></div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#fedf89] bg-[#fffcf5] p-5"><div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-[#b54708] font-semibold"><CircleAlert className="w-4 h-4" /> Observation</div><h3 className="text-[17px] font-semibold mt-2">Game B skips the animation far more often</h3><div className="grid grid-cols-3 gap-3 mt-4">{[['Game A', '12%'], ['Game B', '65%'], ['Game C', '18%']].map(([name, value]) => <div key={name} className="rounded-xl bg-white border border-[#f8e4b1] p-3"><div className="text-[11px] text-muted">{name}</div><div className={cx('text-[22px] font-semibold tabular-nums mt-1', name === 'Game B' ? 'text-[#b54708]' : 'text-ink')}>{value}</div><div className="h-1.5 bg-[#f6e7bf] rounded-full mt-2 overflow-hidden"><div className={cx('h-full rounded-full', name === 'Game B' ? 'bg-[#f79009]' : 'bg-[#fdb022]')} style={{ width: value }} /></div></div>)}</div></div>
              <div className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-muted font-semibold"><Users className="w-4 h-4" /> Investigation</div><div className="mt-3 divide-y divide-line">{TEAM_REVIEW.map(([team, responsibility]) => <div key={team} className="py-3 first:pt-0 last:pb-0 grid grid-cols-[112px_1fr] gap-3"><div className="text-[12.5px] font-semibold">{team}</div><div className="text-[12.5px] text-muted leading-relaxed">{responsibility}</div></div>)}</div></div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-muted font-semibold"><ShieldCheck className="w-4 h-4" /> Decision boundary</div><p className="text-[12.5px] text-muted mt-2 mb-3">Before changing the shared skill, compare the signal against these possible owners.</p><div className="space-y-2">{DECISION_ROWS.map(([owner, evidence, action]) => <div key={owner} className="rounded-xl bg-subtle p-3"><div className="text-[12.5px] font-semibold">{owner}</div><div className="text-[11.5px] text-muted mt-1"><span className="font-medium text-ink-2">Evidence:</span> {evidence}</div><div className="text-[11.5px] text-muted mt-0.5"><span className="font-medium text-ink-2">Likely action:</span> {action}</div></div>)}</div></div>
              <div className="rounded-2xl border border-[#c7d7ff] bg-[#f7f9ff] p-5"><div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-accent font-semibold"><Lightbulb className="w-4 h-4" /> Improvement</div><h3 className="text-[16px] font-semibold mt-2">Optimize reveal timing without changing authority</h3><p className="text-[12.5px] text-muted leading-relaxed mt-2">Propose a shorter default animation and expose a configurable <span className="font-mono text-ink-2">revealTimingMs</span> property. The host still owns reward eligibility and crediting.</p></div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-muted font-semibold"><PackageCheck className="w-4 h-4" /> New skill version</div><div className="flex items-center gap-3 mt-3"><span className="text-[20px] font-semibold font-mono">v1.1</span><ChevronRight className="w-4 h-4 text-faint" /><span className="text-[20px] font-semibold font-mono text-accent">v1.2 proposal</span><Pill tone="warning">Not published</Pill></div><p className="text-[12.5px] text-muted leading-relaxed mt-3">A proposed Reward Reveal update: timing optimization, configurable reveal timing, and clearer performance fallback notes. Existing verified lifecycle behavior is not overwritten.</p><div className="flex items-center gap-2 mt-4 text-[11.5px] text-muted"><Wrench className="w-3.5 h-3.5" /> Independent review and versioned validation required</div></div>
          <div className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-muted font-semibold"><CheckCircle2 className="w-4 h-4 text-[#12b76a]" /> Validation plan</div><p className="text-[12.5px] text-muted mt-2 mb-3">Compare v1.2 with v1.1 across all three games; do not make their experiences visually identical.</p><div className="space-y-2">{VALIDATION_ROWS.map(([metric, baseline, check]) => <div key={metric} className="grid grid-cols-[110px_70px_1fr] gap-2 items-start text-[11.5px]"><span className="font-medium">{metric}</span><span className="font-mono text-muted">{baseline}</span><span className="text-muted">{check}</span></div>)}</div></div>
        </section>

        <section className="rounded-2xl border border-line bg-white overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-line flex items-start justify-between gap-4"><div><h2 className="text-[18px] font-semibold">Reward Reveal event specification</h2><p className="text-[12.5px] text-muted mt-1">A contract for a future integration, not actual event emission or live collection.</p></div><Code2 className="w-5 h-5 text-muted" /></div>
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] min-h-[330px]">
            <div className="border-b lg:border-b-0 lg:border-r border-line bg-subtle/50 p-3 space-y-1">{EVENTS.map((event) => <button type="button" key={event.name} onClick={() => setSelectedEventName(event.name)} className={cx('w-full text-left rounded-lg px-3 py-2.5 transition-colors cursor-pointer', selectedEventName === event.name ? 'bg-white shadow-[0_1px_3px_rgba(16,24,40,0.08)] text-ink' : 'text-muted hover:bg-white/70 hover:text-ink')}><div className="text-[12px] font-mono break-all">{event.name}</div></button>)}</div>
            <div className="p-5"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center"><Code2 className="w-4 h-4" /></span><div><h3 className="text-[15px] font-semibold font-mono">{selectedEvent.name}</h3><Pill tone="neutral">Specification only</Pill></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5"><div><div className="text-[11px] uppercase tracking-[0.07em] text-muted font-semibold">When it fires</div><p className="text-[13px] leading-relaxed mt-1.5">{selectedEvent.fires}</p></div><div><div className="text-[11px] uppercase tracking-[0.07em] text-muted font-semibold">Outcome</div><p className="text-[13px] font-mono mt-1.5">{selectedEvent.outcome}</p></div><div><div className="text-[11px] uppercase tracking-[0.07em] text-muted font-semibold">Relevant properties</div><div className="flex flex-wrap gap-1.5 mt-2">{selectedEvent.properties.map((property) => <span key={property} className="px-2 py-1 rounded-md bg-subtle text-[11px] font-mono text-ink-2">{property}</span>)}</div></div><div><div className="text-[11px] uppercase tracking-[0.07em] text-muted font-semibold">Context fields</div><p className="text-[12px] text-muted leading-relaxed mt-1.5">{selectedEvent.context}</p></div></div><div className="rounded-xl bg-[#f7f9ff] border border-[#dbe5ff] p-3.5 mt-5 text-[12px] text-ink-2"><span className="font-semibold">Privacy boundary:</span> the contract uses interaction, skill, game, and version context only. It does not require names, message content, precise location, or other unnecessary personal information.</div></div>
          </div>
        </section>

        <div className="rounded-xl border border-[#c7d7ff] bg-[#f7f9ff] px-4 py-3 flex items-start gap-3 mb-4"><GitBranch className="w-4 h-4 text-accent mt-0.5 shrink-0" /><p className="text-[12.5px] text-ink-2 leading-relaxed"><span className="font-semibold">Boundary:</span> this page documents a feedback workflow and event contract. It does not collect live player telemetry, connect to an analytics backend, alter Reward Reveal’s lifecycle, change host credit authority, or modify workspace persistence and ZIP import/export.</p></div>
      </div>
    </div>
  );
};
