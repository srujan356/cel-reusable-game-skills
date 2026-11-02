import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioLines,
  Box,
  ChevronDown,
  ChevronRight,
  Circle,
  Coins,
  Eye,
  Film,
  Layers,
  Link2,
  MousePointerClick,
  Package,
  Palette,
  PanelTop,
  Play,
  Plug,
  Plus,
  Replace,
  RotateCcw,
  RotateCw,
  Search,
  Shapes,
  SkipForward,
  Sparkles,
  Spline,
  Target,
  Terminal,
  Trash2,
  TriangleAlert,
  Upload,
  Volume2,
  X,
  Check,
  ChevronUp,
  Maximize2,
  Minimize2,
  Minus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ACTION_CATALOG, EDGE_CASE_SCENARIOS } from '../data/mockData';
import {
  ActionCategory,
  AssetItem,
  CanvasConnection,
  CanvasNode,
  ComponentCategory,
  ComponentDefinition,
  ComponentInstance,
  ComponentSlotId,
  EdgeCaseScenarioId,
  MoveProperties,
  PlaygroundConfiguration,
  PreviewInteractionState,
  RotateProperties,
  ScaleProperties,
  SkillComponentSlot,
  TrajectoryType,
  TriggerType,
} from '../types/platform';
import { RewardTokenGlyph } from './AssetVisuals';
import { ComponentLibraryPanel } from './ComponentLibraryPanel';
import { RewardStage, trajectoryPath } from './RewardStage';
import {
  Button,
  Dot,
  Field,
  IconButton,
  NumberInput,
  Pill,
  Section,
  Segmented,
  SelectInput,
  SliderRow,
  Toggle,
  cx,
} from './ui';

interface PlaygroundViewProps {
  assets: AssetItem[];
  components: SkillComponentSlot[];
  nodes: CanvasNode[];
  connections: CanvasConnection[];
  config: PlaygroundConfiguration;
  componentDefinitions: ComponentDefinition[];
  componentInstances: ComponentInstance[];
  onCreateComponentInstance: (definitionId: string, slotId?: ComponentSlotId) => void;
  onUpdateComponentInstance: (instanceId: string, patch: Partial<ComponentInstance>) => void;
  onUpdateConfig: (patch: Partial<PlaygroundConfiguration>) => void;
  onUpdateNode: (nodeId: string, patch: Partial<CanvasNode>) => void;
  onAddNode: (node: CanvasNode, connectFromId?: string) => void;
  onRemoveNode: (nodeId: string) => void;
  onAddConnection: (conn: CanvasConnection) => void;
  onOpenReplaceModal: (slotId: ComponentSlotId) => void;
  onOpenImportModal: () => void;
  onRemoveAssetFromSkill: (assetId: string) => void;
  onAssignAssetToSlot: (assetId: string, slotId: ComponentSlotId) => void;
}

const SLOT_ICON: Record<ComponentSlotId, LucideIcon> = {
  reward_container: Box,
  container_body: Package,
  lid_opening_element: PanelTop,
  reward_item: Coins,
  reveal_effect: Sparkles,
  audio_slot: AudioLines,
  collection_destination: Target,
};

const NODE_STYLE: Record<string, { icon: LucideIcon; tint: string }> = {
  Component: { icon: Box, tint: 'bg-subtle text-ink-2' },
  Trigger: { icon: MousePointerClick, tint: 'bg-[#fff6e5] text-[#b54708]' },
  Composite: { icon: Layers, tint: 'bg-accent-soft text-accent' },
  Transform: { icon: RotateCw, tint: 'bg-[#f4f0ff] text-[#6941c6]' },
  Motion: { icon: Spline, tint: 'bg-[#ecfdf3] text-[#067647]' },
  Animation: { icon: Film, tint: 'bg-[#f4f0ff] text-[#6941c6]' },
  Appearance: { icon: Palette, tint: 'bg-[#fdf2fa] text-[#c11574]' },
  Visibility: { icon: Eye, tint: 'bg-subtle text-ink-2' },
  Object: { icon: Shapes, tint: 'bg-subtle text-ink-2' },
  Effects: { icon: Sparkles, tint: 'bg-[#fff6e5] text-[#b54708]' },
  Audio: { icon: Volume2, tint: 'bg-[#eff8ff] text-[#175cd3]' },
  'Game Integration': { icon: Plug, tint: 'bg-[#f0fdf9] text-[#0e9384]' },
  State: { icon: Circle, tint: 'bg-subtle text-ink-2' },
};
const styleOf = (n?: CanvasNode) => NODE_STYLE[n?.category || 'State'] || NODE_STYLE.State;

const DEF_ROT: RotateProperties = { axis: 'X', angleDeg: -115, direction: 'CCW', pivotOrigin: 'Lid_Hinge_Back_01', coordinateSpace: 'Local', durationMs: 480, delayMs: 40, easing: 'OutBack' };
const DEF_MOVE: MoveProperties = { startPos: [0, 24, 0], destination: [320, -140, 0], destinationTargetSlot: 'collection_destination', coordinateSpace: 'ScreenUI', durationMs: 680, delayMs: 120, easing: 'OutCubic' };
const DEF_SCALE: ScaleProperties = { mode: 'Uniform', scaleX: 1, scaleY: 1, scaleZ: 1, anchorOrigin: 'Bottom-Center', durationMs: 320, easing: 'OutBack' };

const COMPOSER_GROUPS: { id: string; items: readonly string[]; trigger?: boolean }[] = [
  { id: 'Player input', items: ACTION_CATALOG.triggers.playerInputs, trigger: true },
  { id: 'Game events', items: ACTION_CATALOG.triggers.gameEvents, trigger: true },
  ...Object.entries(ACTION_CATALOG.responseActions).map(([id, items]) => ({ id, items })),
];

const STEPS: PreviewInteractionState[] = ['Closed', 'Opening', 'Revealed', 'Collecting', 'Completed'];
const NODE_W = 180;
const NODE_H = 56;

const easingOpts = ['OutBack', 'OutCubic', 'InOutQuad', 'Spring', 'Linear'].map((v) => ({ value: v, label: v }));

function TimingFields({ dur, delay, easing, onDur, onDelay, onEase }: { dur: number; delay?: number; easing: string; onDur: (v: number) => void; onDelay?: (v: number) => void; onEase: (v: string) => void }) { return (
    <div className="grid grid-cols-3 gap-2">
      <Field label="Duration">
        <NumberInput value={dur} onChange={onDur} unit="ms" step={20} />
      </Field>
      <Field label="Delay">
        <NumberInput value={delay ?? 0} onChange={(v) => onDelay?.(v)} unit="ms" step={10} />
      </Field>
      <Field label="Easing">
        <SelectInput value={easing} onChange={onEase} options={easingOpts} />
      </Field>
    </div>
  ); }

type LogEntry = { t: string; src: string; msg: string; kind: 'info' | 'warn' | 'err' | 'ok' };
const short = (a?: AssetItem | null) => (a ? a.name.split(' (')[0] : 'None');

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  assets,
  components,
  nodes,
  connections,
  config,
  componentDefinitions,
  componentInstances,
  onCreateComponentInstance,
  onUpdateComponentInstance,
  onUpdateConfig,
  onUpdateNode,
  onAddNode,
  onRemoveNode,
  onAddConnection,
  onOpenReplaceModal,
  onOpenImportModal,
  onRemoveAssetFromSkill,
  onAssignAssetToSlot,
}) => {
  const [leftTab, setLeftTab] = useState<'components' | 'assets' | 'library'>('components');
  const [rightTab, setRightTab] = useState<'properties' | 'actions' | 'variants' | 'settings'>('properties');
  const [selectedNodeId, setSelectedNodeId] = useState('node_prim_trajectory');
  const [selectedSlotId, setSelectedSlotId] = useState<ComponentSlotId>('reward_item');
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerGroup, setComposerGroup] = useState('Player input');
  const [composerQuery, setComposerQuery] = useState('');
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [autoFit, setAutoFit] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [focus, setFocus] = useState(false);
  const isGenericWorkspace = config.presetName === 'Empty Playground';
  const contentRef = useRef<HTMLDivElement>(null);
  const [groupExpanded, setGroupExpanded] = useState(true);
  const [retryPolicy, setRetryPolicy] = useState('same-key-3');
  const canvasRef = useRef<HTMLDivElement>(null);

  // preview runtime
  const [previewState, setPreviewState] = useState<PreviewInteractionState>('Closed');
  const stateRef = useRef<PreviewInteractionState>('Closed');
  const [lidOpen, setLidOpen] = useState(false);
  const [wallet, setWallet] = useState(120);
  const [rewardId, setRewardId] = useState('rwd_88410');
  const [requests, setRequests] = useState(0);
  const creditedRef = useRef(false);
  const [debounced, setDebounced] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([{ t: '00.0', src: 'runtime', msg: 'Ready · waiting for trigger', kind: 'info' }]);
  const timers = useRef<number[]>([]);

  const go = (s: PreviewInteractionState) => {
    stateRef.current = s;
    setPreviewState(s);
  };
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
  const push = (src: string, msg: string, kind: LogEntry['kind'] = 'info') => {
    const d = new Date();
    const t = `${String(d.getSeconds()).padStart(2, '0')}.${Math.floor(d.getMilliseconds() / 100)}`;
    setLog((p) => [{ t, src, msg, kind }, ...p].slice(0, 30));
  };
  useEffect(() => () => clear(), []);

  const slot = (id: ComponentSlotId) => components.find((c) => c.id === id);
  const assetOf = (id: ComponentSlotId) => assets.find((a) => a.id === slot(id)?.assignedAssetId) || null;
  const containerAsset = assetOf('reward_container');
  const rewardAsset = assetOf('reward_item');
  const destAsset = slot('collection_destination')?.assignedAssetId;
  const staticContainer = containerAsset?.visualKind === 'chest_wood_static';
  const ec = config.activeEdgeCase;
  const noDestination = ec === 'missing_destination' || !destAsset;
  const qty = config.rewardQuantity;

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || nodes[0], [nodes, selectedNodeId]);
  const rotateNode = nodes.find((n) => n.id === 'node_prim_rotate_lid');
  const containerNode = nodes.find((n) => n.id === 'node_comp_container');
  const rot = rotateNode?.rotateProps || DEF_ROT;
  const clipMs = ({ Pop: 850, Fast: 480, Slow: 1450 } as Record<string, number>)[config.openingStyle] ?? rot.durationMs;
  const speed = 1 / Math.max(0.5, config.playbackSpeed);
  const openMs = config.reducedMotion ? 150 : Math.round(clipMs * speed);

  /* ---------------- runtime ---------------- */
  const validationError = (): string | null => {
    if (staticContainer || ec === 'missing_opening_anim') return 'Container has no opening clip or lid pivot';
    if (qty <= 0 || qty > 50 || ec === 'invalid_quantity') return 'Reward quantity must be between 1 and 50';
    if (!rewardAsset || ec === 'missing_reward_asset') return 'Reward Item slot is empty';
    return null;
  };

  const fire = (source = 'Tap') => {
    const st = stateRef.current;
    if (st === 'Opening' || st === 'Revealed' || st === 'Collecting') {
      setDebounced((d) => d + 1);
      push('input', `${source} ignored · already ${st.toLowerCase()}`, 'warn');
      return;
    }
    const err = validationError();
    if (err) {
      clear();
      setLidOpen(false);
      go('Error');
      push('validator', err, 'err');
      return;
    }
    clear();
    const id = `rwd_${Math.floor(10000 + Math.random() * 89999)}`;
    setRewardId(id);
    setRequests(0);
    setDebounced(0);
    creditedRef.current = false;
    const flyMs = config.reducedMotion ? 200 : Math.round(config.durationMs * speed);
    setLidOpen(true);
    go('Opening');
    push('trigger', `${source} → opening (${config.openingStyle})`);
    later(openMs, () => {
      if (ec === 'interrupted_interaction') {
        go('Interrupted');
        push('lifecycle', 'App backgrounded · state saved', 'warn');
        return;
      }
      go('Revealed');
      push('spawn', `${qty}× ${short(rewardAsset)} revealed`);
      later(flyMs, () => {
        go('Collecting');
        setRequests((r) => (r === 0 ? 1 : r));
        push('host', `CollectReward(${id}) sent`);
        later(650, () => {
          if (ec === 'host_collection_failure') {
            go('Error');
            push('host', 'Rejected (simulated) · not credited', 'err');
          } else {
            if (!creditedRef.current) {
              creditedRef.current = true;
              setWallet((w) => w + qty);
            }
            go('Completed');
            push('host', `Confirmed · +${qty} credited`, 'ok');
          }
        });
      });
    });
  };

  const tapFive = () => {
    fire('Tap #1');
    [2, 3, 4, 5].forEach((i) => window.setTimeout(() => fire(`Tap #${i}`), i * 80));
  };

  const skip = () => {
    const st = stateRef.current;
    if (!config.skipEnabled) return push('skip', 'Skip is disabled', 'warn');
    if (st === 'Closed' || st === 'Completed' || st === 'Error') return push('skip', `No effect while ${st.toLowerCase()}`);
    clear();
    if (st === 'Collecting') {
      push('skip', 'Snapped to end · no duplicate request', 'ok');
    } else {
      go('Collecting');
      setRequests((r) => (r === 0 ? 1 : r));
      push('skip', 'Fast-forwarded · reward kept', 'warn');
    }
    later(380, () => {
      if (ec === 'host_collection_failure') {
        go('Error');
        push('host', 'Rejected (simulated) · not credited', 'err');
      } else {
        if (!creditedRef.current) {
          creditedRef.current = true;
          setWallet((w) => w + qty);
        }
        go('Completed');
        push('host', `Confirmed · +${qty} credited`, 'ok');
      }
    });
  };

  const reset = () => {
    clear();
    setLidOpen(false);
    creditedRef.current = false;
    go('Closed');
  };

  const retry = () => {
    clear();
    go('Collecting');
    push('host', `Retry with same key ${rewardId}`);
    later(500, () => {
      onUpdateConfig({ activeEdgeCase: 'normal' });
      if (!creditedRef.current) {
        creditedRef.current = true;
        setWallet((w) => w + qty);
      }
      go('Completed');
      push('host', `Confirmed · +${qty} credited`, 'ok');
    });
  };

  const selectScenario = (id: EdgeCaseScenarioId) => {
    const patch: Partial<PlaygroundConfiguration> = { activeEdgeCase: id, reducedMotion: id === 'reduced_motion' };
    if (id === 'invalid_quantity') patch.rewardQuantity = 0;
    else if (qty <= 0) patch.rewardQuantity = 8;
    onUpdateConfig(patch);
    reset();
    const sc = EDGE_CASE_SCENARIOS.find((s) => s.id === id);
    push('scenario', sc?.label || id);
    if (id === 'missing_opening_anim' || id === 'missing_reward_asset' || id === 'invalid_quantity') {
      go('Error');
      push('validator', sc?.expectedBehavior.split(';')[0] || 'Validation failed', 'err');
    }
    if (id === 'repeated_taps') window.setTimeout(tapFive, 60);
  };

  const errorMsg = (() => {
    if (previewState === 'Interrupted') return { title: 'Interrupted', body: 'State saved. Resume or fast-forward.', action: 'Resume', fn: skip };
    if (previewState !== 'Error') return null;
    if (lidOpen) return { title: 'Collection failed', body: 'Host rejected the request. Nothing credited.', action: 'Retry', fn: retry };
    return { title: 'Can’t run', body: validationError() || 'Validation failed', action: 'Reset', fn: () => { onUpdateConfig({ activeEdgeCase: 'normal', rewardQuantity: qty <= 0 ? 8 : qty }); reset(); } };
  })();

  /* ---------------- canvas ---------------- */
  const selectNode = (n: CanvasNode) => {
    if (connectingFrom && connectingFrom !== n.id) {
      onAddConnection({ id: `conn_${Date.now()}`, fromNodeId: connectingFrom, toNodeId: n.id, label: 'Then', flowType: 'Sequential' });
      setConnectingFrom(null);
      push('graph', `Linked → ${n.label}`, 'ok');
      return;
    }
    setSelectedNodeId(n.id);
    if (n.targetSlotId) setSelectedSlotId(n.targetSlotId);
    setRightTab('properties');
  };

  const removeSelected = () => {
    if (!selectedNode || selectedNode.id === 'node_comp_container') return;
    onRemoveNode(selectedNode.id);
    push('graph', `Removed ${selectedNode.label}`, 'warn');
    setSelectedNodeId('node_comp_open_group');
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        setConnectingFrom(null);
        setComposerOpen(false);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') removeSelected();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const onCanvasMove = (e: React.MouseEvent) => {
    if (!drag || !contentRef.current) return;
    const r = contentRef.current.getBoundingClientRect();
    const x = Math.max(8, (e.clientX - r.left) / zoom - drag.dx);
    const y = Math.max(8, (e.clientY - r.top) / zoom - drag.dy);
    onUpdateNode(drag.id, { x: Math.round(x), y: Math.round(y) });
  };

  const groupNodes = nodes.filter((n) => n.id === 'node_comp_open_group' || n.parentCompositeId === 'node_comp_open_group');
  const groupBox = groupNodes.length
    ? {
        x: Math.min(...groupNodes.map((n) => n.x)) - 16,
        y: Math.min(...groupNodes.map((n) => n.y)) - 30,
        w: Math.max(...groupNodes.map((n) => n.x)) - Math.min(...groupNodes.map((n) => n.x)) + NODE_W + 32,
        h: Math.max(...groupNodes.map((n) => n.y)) - Math.min(...groupNodes.map((n) => n.y)) + NODE_H + 46,
      }
    : null;

  const addFromComposer = (group: string, item: string, trigger?: boolean) => {
    if (trigger) {
      onUpdateConfig({ activeTrigger: item as TriggerType });
      onUpdateNode('node_trig_tap', { label: item, subtitle: group === 'Player input' ? 'Player input · debounced' : 'Host game event', triggerType: item as TriggerType });
      setSelectedNodeId('node_trig_tap');
      push('graph', `Trigger set to ${item}`, 'ok');
    } else {
      const id = `node_act_${Date.now()}`;
      const src = nodes.find((n) => n.id === selectedNodeId);
      onAddNode(
        {
          id,
          kind: 'primitive_action',
          label: item,
          subtitle: `${group} · ${selectedSlotId.replace(/_/g, ' ')}`,
          category: group as ActionCategory,
          x: (src?.x ?? 520) + 30,
          y: (src?.y ?? 160) + 96,
          targetSlotId: selectedSlotId,
          parentCompositeId: 'node_comp_open_group',
          flowExecution: 'Parallel',
          exposedToSchema: true,
        },
        selectedNodeId
      );
      setSelectedNodeId(id);
      push('graph', `Added ${group}: ${item}`, 'ok');
    }
    setComposerOpen(false);
    setComposerQuery('');
  };

  const composerItems = composerQuery.trim()
    ? COMPOSER_GROUPS.flatMap((g) => g.items.filter((i) => i.toLowerCase().includes(composerQuery.toLowerCase())).map((i) => ({ g, i })))
    : (COMPOSER_GROUPS.find((g) => g.id === composerGroup)?.items || []).map((i) => ({ g: COMPOSER_GROUPS.find((x) => x.id === composerGroup)!, i }));

  /* ---------------- inspector ---------------- */
  const updRot = (p: Partial<RotateProperties>) => selectedNode && onUpdateNode(selectedNode.id, { rotateProps: { ...(selectedNode.rotateProps || DEF_ROT), ...p } });
  const updMove = (p: Partial<MoveProperties>) => selectedNode && onUpdateNode(selectedNode.id, { moveProps: { ...(selectedNode.moveProps || DEF_MOVE), ...p } });
  const updScale = (p: Partial<ScaleProperties>) => selectedNode && onUpdateNode(selectedNode.id, { scaleProps: { ...(selectedNode.scaleProps || DEF_SCALE), ...p } });
  const renderProperties = () => {
    const n = selectedNode;
    if (!n) return null;
    const cat = n.category;
    const mp = n.moveProps || DEF_MOVE;
    const sp = n.scaleProps || DEF_SCALE;

    if (cat === 'Trigger') {
      return (
        <Section title="Trigger">
          <div className="space-y-3">
            <Field label="Event">
              <SelectInput
                value={config.activeTrigger}
                onChange={(v) => addFromComposer(ACTION_CATALOG.triggers.playerInputs.includes(v as never) ? 'Player input' : 'Game events', v, true)}
                options={[
                  ...ACTION_CATALOG.triggers.playerInputs.map((v) => ({ value: v, label: v, group: 'Player input' })),
                  ...ACTION_CATALOG.triggers.gameEvents.map((v) => ({ value: v, label: v, group: 'Game events' })),
                ]}
              />
            </Field>
            <Field label="Source">
              <SelectInput value="reward_container" onChange={() => undefined} options={[{ value: 'reward_container', label: 'Reward Container' }]} />
            </Field>
            <div className="flex items-center justify-between text-[12.5px] pt-1">
              <span className="text-ink-2">Debounce repeats</span>
              <Pill tone="success">Always on</Pill>
            </div>
          </div>
        </Section>
      );
    }

    if (cat === 'Composite' || cat === 'Animation') {
      const clips = containerAsset?.extractedFacts.animationClips || [];
      return (
        <>
          <Section title="Opening">
            <div className="space-y-3">
              <Field label="Implementation">
                <Segmented
                  value={config.openingImplementation === 'procedural_lid_pivot' ? 'pivot' : 'clip'}
                  onChange={(v) => onUpdateConfig({ openingImplementation: v === 'pivot' ? 'procedural_lid_pivot' : 'animation_clip', openingStyle: v === 'pivot' ? 'Procedural Hinge' : 'Pop' })}
                  options={[
                    { value: 'clip', label: 'Clip' },
                    { value: 'pivot', label: 'Lid pivot' },
                  ]}
                />
              </Field>
              <Field label={`Clip · ${clips.length} available`}>
                <SelectInput
                  value={config.openingStyle}
                  onChange={(v) => onUpdateConfig({ openingStyle: v as PlaygroundConfiguration['openingStyle'] })}
                  options={[
                    { value: 'Pop', label: 'Chest_Open_Pop · 0.85s', disabled: clips.length === 0 },
                    { value: 'Fast', label: 'Chest_Open_Fast · 0.48s', disabled: clips.length === 0 },
                    { value: 'Slow', label: 'Chest_Open_Dramatic · 1.45s', disabled: clips.length === 0 },
                    { value: 'Procedural Hinge', label: 'Procedural hinge' },
                  ]}
                />
              </Field>
              <SliderRow label="Playback speed" value={config.playbackSpeed} min={0.5} max={2} step={0.1} unit="×" onChange={(v) => onUpdateConfig({ playbackSpeed: v })} />
              <div className="grid grid-cols-3 gap-2">
                <Field label="Start">
                  <NumberInput value={0} onChange={() => undefined} unit="s" step={0.05} />
                </Field>
                <Field label="End">
                  <NumberInput value={clipMs / 1000} onChange={() => undefined} unit="s" step={0.05} />
                </Field>
                <Field label="Blend">
                  <NumberInput value={1} onChange={() => undefined} step={0.1} />
                </Field>
              </div>
            </div>
          </Section>
          {cat === 'Composite' && (
            <Section title="Steps">
              <div className="space-y-1">
                {groupNodes
                  .filter((g) => g.id !== n.id)
                  .map((g, i) => {
                    const S = styleOf(g);
                    return (
                      <button key={g.id} type="button" onClick={() => selectNode(g)} className="w-full flex items-center gap-2.5 h-9 px-2 rounded-lg hover:bg-subtle text-left cursor-pointer">
                        <span className="text-[11px] text-faint w-3 tabular-nums">{i + 1}</span>
                        <span className={cx('w-6 h-6 rounded-md flex items-center justify-center', S.tint)}>
                          <S.icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="flex-1 text-[12.5px] truncate">{g.label}</span>
                        <span className="text-[11px] text-muted">{g.flowExecution}</span>
                      </button>
                    );
                  })}
              </div>
            </Section>
          )}
        </>
      );
    }

    if (cat === 'Transform') {
      const rp = n.rotateProps || DEF_ROT;
      return (
        <Section title="Rotate">
          <div className="space-y-3">
            <Field label="Axis">
              <Segmented value={rp.axis} onChange={(v) => updRot({ axis: v })} options={(['X', 'Y', 'Z'] as const).map((v) => ({ value: v, label: v }))} />
            </Field>
            <SliderRow label="Angle" value={rp.angleDeg} min={-180} max={180} unit="°" onChange={(v) => updRot({ angleDeg: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Direction">
                <Segmented value={rp.direction} onChange={(v) => updRot({ direction: v })} options={[{ value: 'CCW', label: 'CCW' }, { value: 'CW', label: 'CW' }]} />
              </Field>
              <Field label="Space">
                <Segmented value={rp.coordinateSpace} onChange={(v) => updRot({ coordinateSpace: v })} options={[{ value: 'Local', label: 'Local' }, { value: 'World', label: 'World' }]} />
              </Field>
            </div>
            <Field label="Pivot">
              <SelectInput value="hinge" onChange={() => undefined} options={[{ value: 'hinge', label: 'Lid_Hinge_Back_01 · 0, 0.42, −0.38' }]} />
            </Field>
            <TimingFields dur={rp.durationMs} delay={rp.delayMs} easing={rp.easing} onDur={(v) => updRot({ durationMs: v })} onDelay={(v) => updRot({ delayMs: v })} onEase={(v) => updRot({ easing: v as RotateProperties['easing'] })} />
          </div>
        </Section>
      );
    }

    if (cat === 'Motion') {
      return (
        <>
          <Section title="Trajectory">
            <div className="space-y-3">
              <Segmented
                value={config.trajectoryType}
                onChange={(v) => onUpdateConfig({ trajectoryType: v })}
                options={(['Straight', 'Arc', 'Bezier', 'Wave', 'Custom'] as TrajectoryType[]).map((v) => ({ value: v, label: v === 'Straight' ? 'Line' : v }))}
              />
              <div className="rounded-lg bg-night p-2 h-[86px]">
                <svg viewBox="180 0 320 150" className="w-full h-full">
                  <path d={trajectoryPath(config.trajectoryType, config.arcHeightPx * 0.55)} fill="none" stroke="#5b8cff" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="200" cy="124" r="5" fill="#f6c453" />
                  <circle cx="468" cy="56" r="5" fill="#12b76a" />
                </svg>
              </div>
              {(config.trajectoryType === 'Arc' || config.trajectoryType === 'Bezier' || config.trajectoryType === 'Wave') && (
                <SliderRow label={config.trajectoryType === 'Wave' ? 'Amplitude' : 'Height'} value={config.arcHeightPx} min={20} max={220} unit="px" onChange={(v) => onUpdateConfig({ arcHeightPx: v })} />
              )}
              {config.trajectoryType === 'Arc' && (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Direction">
                    <SelectInput value="up" onChange={() => undefined} options={[{ value: 'up', label: 'Upward' }, { value: 'radial', label: 'Radial' }]} />
                  </Field>
                  <Field label="Angle">
                    <NumberInput value={config.arcAngleDeg} onChange={(v) => onUpdateConfig({ arcAngleDeg: v })} unit="°" />
                  </Field>
                </div>
              )}
              {config.trajectoryType === 'Bezier' && (
                <div className="grid grid-cols-2 gap-2 font-mono text-[11.5px]">
                  {[
                    ['Start', '0, 0'],
                    ['End', '320, −140'],
                    ['P1', `95, −${config.arcHeightPx}`],
                    ['P2', `235, −${Math.round(config.arcHeightPx * 0.7)}`],
                  ].map(([k, v]) => (
                    <div key={k} className="h-8 px-2.5 rounded-lg bg-subtle flex items-center justify-between">
                      <span className="text-muted font-sans">{k}</span>
                      {v}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
          <Section title="Move">
            <div className="space-y-3">
              <Field label="Destination">
                <SelectInput value={mp.destinationTargetSlot} onChange={(v) => updMove({ destinationTargetSlot: v as MoveProperties['destinationTargetSlot'] })} options={[{ value: 'collection_destination', label: 'Collection Destination' }, { value: 'Coordinates', label: 'Coordinates' }]} />
              </Field>
              <Field label="Space">
                <Segmented value={mp.coordinateSpace} onChange={(v) => updMove({ coordinateSpace: v })} options={[{ value: 'ScreenUI', label: 'Screen' }, { value: 'World', label: 'World' }, { value: 'Local', label: 'Local' }]} />
              </Field>
              <TimingFields dur={config.durationMs} delay={mp.delayMs} easing={mp.easing} onDur={(v) => onUpdateConfig({ durationMs: v })} onDelay={(v) => updMove({ delayMs: v })} onEase={(v) => updMove({ easing: v as MoveProperties['easing'] })} />
            </div>
          </Section>
        </>
      );
    }

    if (cat === 'Component' || cat === 'Appearance') {
      const mat = containerAsset?.extractedFacts.materials[0];
      return (
        <>
          <Section title="Appearance">
            {mat?.exposesColorParam ? (
              <div className="space-y-3">
                <Field label="Base color">
                  <div className="flex items-center gap-2">
                    {['#D97706', '#B91C1C', '#2563EB', '#7C3AED', '#059669', '#334155'].map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => onUpdateConfig({ chestColorHex: hex })}
                        style={{ background: hex }}
                        className={cx('w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110', config.chestColorHex === hex ? 'ring-2 ring-offset-2 ring-ink' : '')}
                      />
                    ))}
                  </div>
                </Field>
                <SliderRow label="Glow" value={config.chestGlowIntensity} min={0} max={2} step={0.1} onChange={(v) => onUpdateConfig({ chestGlowIntensity: v })} />
                <Field label="Material">
                  <SelectInput value="m" onChange={() => undefined} options={[{ value: 'm', label: mat.name }]} />
                </Field>
              </div>
            ) : (
              <div className="flex gap-2.5 p-3 rounded-lg bg-[#fffaeb] text-[12px] text-[#93370d]">
                <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                Baked texture — color can’t be tinted. Replace the texture instead.
              </div>
            )}
          </Section>
          {cat === 'Component' && (
            <Section title="Scale">
              <div className="space-y-3">
                <SliderRow label="Uniform scale" value={sp.scaleX} min={0.5} max={1.5} step={0.05} unit="×" onChange={(v) => updScale({ scaleX: v, scaleY: v, scaleZ: v })} />
                <Field label="Anchor">
                  <SelectInput value={sp.anchorOrigin} onChange={(v) => updScale({ anchorOrigin: v as ScaleProperties['anchorOrigin'] })} options={['Bottom-Center', 'Center', 'Lid-Hinge'].map((v) => ({ value: v, label: v }))} />
                </Field>
              </div>
            </Section>
          )}
        </>
      );
    }

    if (cat === 'Effects') {
      return (
        <>
          <Section title="Spawn">
            <div className="space-y-3">
              <Field label="Reward quantity">
                <NumberInput value={qty} min={0} max={50} onChange={(v) => onUpdateConfig({ rewardQuantity: v })} invalid={qty <= 0 || qty > 50} />
              </Field>
              {(qty <= 0 || qty > 50) && <p className="text-[11.5px] text-[#b42318] -mt-1">Must be between 1 and 50</p>}
              <SliderRow label="Spawn scale" value={sp.scaleX} min={0.5} max={1.5} step={0.05} unit="×" onChange={(v) => updScale({ scaleX: v })} />
            </div>
          </Section>
          <Section title="Effect">
            <div className="space-y-3">
              <SliderRow label="Intensity" value={config.effectIntensity} min={0} max={100} unit="%" onChange={(v) => onUpdateConfig({ effectIntensity: v })} />
              <Button variant="secondary" size="sm" className="w-full" icon={<Replace className="w-3.5 h-3.5" />} onClick={() => onOpenReplaceModal('reveal_effect')}>
                Change effect
              </Button>
            </div>
          </Section>
        </>
      );
    }

    if (cat === 'Game Integration') {
      return (
        <Section title="Host collection">
          <div className="space-y-3">
            <div className="flex items-center justify-between h-8 px-2.5 rounded-lg bg-subtle text-[12px]">
              <span className="text-muted">Idempotency key</span>
              <span className="font-mono">hostRewardId</span>
            </div>
            <Field label="On failure">
              <SelectInput value={retryPolicy} onChange={setRetryPolicy} options={[{ value: 'same-key-3', label: 'Retry same key · 3×' }, { value: 'manual', label: 'Show retry button' }]} />
            </Field>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-ink-2">Host</span>
              <Pill tone="warning">Simulated</Pill>
            </div>
          </div>
        </Section>
      );
    }

    if (cat === 'Audio') {
      return (
        <Section title="Audio">
          <div className="space-y-3">
            <SliderRow label="Volume" value={config.audioVolume} min={0} max={100} unit="%" onChange={(v) => onUpdateConfig({ audioVolume: v })} />
            <SliderRow label="Pitch" value={config.playbackSpeed} min={0.5} max={2} step={0.1} unit="×" onChange={(v) => onUpdateConfig({ playbackSpeed: v })} />
          </div>
        </Section>
      );
    }

    return (
      <Section title="Timing">
        <TimingFields dur={mp.durationMs} delay={mp.delayMs} easing={mp.easing} onDur={(v) => updMove({ durationMs: v })} onDelay={(v) => updMove({ delayMs: v })} onEase={(v) => updMove({ easing: v as MoveProperties['easing'] })} />
      </Section>
    );
  };

  const presets = [
    { name: 'Royal Gold', desc: 'Coins · Arc · Burst', apply: () => { onAssignAssetToSlot('asset_coins_gold_01', 'reward_item'); onUpdateConfig({ chestColorHex: '#D97706', trajectoryType: 'Arc', arcHeightPx: 130 }); } },
    { name: 'Spring Bloom', desc: 'Flowers · Bezier · Soft', apply: () => { onAssignAssetToSlot('asset_flowers_bloom_02', 'reward_item'); onUpdateConfig({ chestColorHex: '#059669', trajectoryType: 'Bezier', arcHeightPx: 160, effectIntensity: 55 }); } },
    { name: 'Sweet Rush', desc: 'Candies · Wave · Fast', apply: () => { onAssignAssetToSlot('asset_candies_wrapped_03', 'reward_item'); onUpdateConfig({ chestColorHex: '#7C3AED', trajectoryType: 'Wave', openingStyle: 'Fast', arcHeightPx: 90 }); } },
  ];

  const S = styleOf(selectedNode);
  const stepIdx = STEPS.indexOf(previewState);

  /* ---------- live execution map ---------- */
  const SEQ = ['node_comp_container', 'node_trig_tap', 'node_comp_open_group', 'node_prim_rotate_lid', 'node_prim_spawn_effect', 'node_prim_trajectory', 'node_prim_collect_req'];
  const live: Record<string, 'active' | 'done' | 'error'> = {};
  const mark = (upTo: number, active: string[]) => {
    SEQ.slice(0, upTo).forEach((id) => (live[id] = 'done'));
    active.forEach((id) => (live[id] = 'active'));
  };
  switch (previewState) {
    case 'Closed':
      live.node_trig_tap = 'active';
      break;
    case 'Opening':
      mark(2, ['node_comp_open_group', 'node_prim_rotate_lid']);
      break;
    case 'Revealed':
      mark(4, ['node_comp_open_group', 'node_prim_spawn_effect']);
      break;
    case 'Collecting':
      mark(5, ['node_prim_trajectory', 'node_prim_collect_req']);
      break;
    case 'Completed':
      mark(7, []);
      live.node_state_completed = 'active';
      break;
    case 'Interrupted':
      mark(3, []);
      live.node_prim_rotate_lid = 'error';
      break;
    case 'Error':
      if (lidOpen) {
        mark(7, []);
        live.node_state_error = 'error';
      } else live.node_comp_container = 'error';
      break;
  }

  const subtitleOf = (n: CanvasNode) => {
    switch (n.id) {
      case 'node_comp_container':
        return `${short(containerAsset).split(' ').slice(-2).join(' ')} · ${lidOpen && previewState !== 'Closed' ? 'Open' : 'Closed'}`;
      case 'node_trig_tap':
        return (ACTION_CATALOG.triggers.gameEvents as readonly string[]).includes(config.activeTrigger) ? 'Host game event' : 'Player input · debounced';
      case 'node_comp_open_group':
        return `Composite · ${groupNodes.length - 1} steps`;
      case 'node_prim_rotate_lid':
        return config.openingImplementation === 'procedural_lid_pivot' ? `Hinge ${rot.axis} ${rot.angleDeg}° · ${rot.durationMs}ms` : `Clip ${config.openingStyle} · ${(clipMs / 1000).toFixed(2)}s`;
      case 'node_prim_spawn_effect':
        return `${short(rewardAsset).split(' ').slice(-1)[0]} ×${qty} · burst ${config.effectIntensity}%`;
      case 'node_prim_trajectory':
        return noDestination ? 'No destination · hover' : `${config.trajectoryType} · ${config.durationMs}ms`;
      default:
        return n.subtitle;
    }
  };

  /* ---------- canvas geometry ---------- */
  const visibleNodes = nodes.filter((n) => groupExpanded || !n.parentCompositeId);
  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const W = Math.max(960, ...visibleNodes.map((n) => n.x + NODE_W + 48));
  const H = Math.max(300, ...visibleNodes.map((n) => n.y + NODE_H + 48));
  const region = groupBox && groupExpanded ? groupBox : null;

  useEffect(() => {
    const el = canvasRef.current;
    if (!autoFit || !el) return;
    const fit = () => {
      const z = Math.min(1.15, (el.clientWidth - 40) / W, (el.clientHeight - 90) / H);
      setZoom(Math.max(0.4, Math.round(z * 100) / 100));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [autoFit, W, H, focus, previewOpen]);

  const zoomBy = (d: number) => {
    setAutoFit(false);
    setZoom((z) => Math.min(2, Math.max(0.3, Math.round((z + d) * 100) / 100)));
  };

  const edgeGeom = (a: CanvasNode, b: CanvasNode) => {
    if (Math.abs(a.x - b.x) < 40 && b.y > a.y) {
      const x1 = a.x + NODE_W / 2;
      const y1 = a.y + NODE_H;
      const x2 = b.x + NODE_W / 2;
      const y2 = b.y - 4;
      return { d: `M ${x1} ${y1} C ${x1} ${y1 + 36}, ${x2} ${y2 - 36}, ${x2} ${y2}`, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
    }
    const x1 = a.x + NODE_W;
    const y1 = a.y + NODE_H / 2;
    const x2 = b.x - 4;
    const y2 = b.y + NODE_H / 2;
    if (x2 < x1) {
      const d = `M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x1 + 60} ${(y1 + y2) / 2}, ${(x1 + x2) / 2} ${(y1 + y2) / 2} S ${x2 - 60} ${y2}, ${x2} ${y2}`;
      return { d, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
    }
    const dx = Math.max(36, (x2 - x1) * 0.5);
    return { d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
  };

  const tabBtn = (active: boolean) => cx('relative h-full text-[12.5px] font-medium capitalize cursor-pointer', active ? 'text-ink' : 'text-muted hover:text-ink-2');
  const tabLine = <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-ink rounded-full" />;

  return (
    <div className="flex-1 flex min-w-0 overflow-hidden">
      {/* ================= MAIN: WORKFLOW + PREVIEW ================= */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 min-h-0 relative">
          {/* title */}
          <div className="absolute top-3 left-4 z-20 flex items-center gap-2.5 pointer-events-none">
            <span className="text-[14px] font-semibold tracking-tight">Workflow</span>
            <span className="h-5 px-2 rounded-md bg-white border border-line text-[11.5px] text-muted inline-flex items-center gap-1.5">
              <span className={cx('w-1.5 h-1.5 rounded-full', previewState === 'Error' || previewState === 'Interrupted' ? 'bg-[#f04438]' : previewState === 'Closed' ? 'bg-faint' : 'bg-[#12b76a] animate-pulse')} />
              {previewState === 'Closed' ? 'Idle' : previewState}
            </span>
          </div>

          {/* toolbar */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 rounded-xl bg-white border border-line shadow-[0_6px_20px_-8px_rgba(16,24,40,0.18)]">
            <Button variant={composerOpen ? 'secondary' : 'ghost'} size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setComposerOpen((o) => !o)}>
              Add
            </Button>
            <IconButton title="Connect from selected node" active={!!connectingFrom} className="w-7 h-7" onClick={() => setConnectingFrom(connectingFrom ? null : selectedNodeId)}>
              <Link2 className="w-3.5 h-3.5" />
            </IconButton>
            <IconButton title="Delete node" className="w-7 h-7" onClick={removeSelected} disabled={selectedNode?.id === 'node_comp_container'}>
              <Trash2 className="w-3.5 h-3.5" />
            </IconButton>
            <span className="w-px h-5 bg-line mx-1" />
            <Segmented
              value={(selectedNode?.flowExecution || 'Sequential') as 'Sequential' | 'Parallel' | 'Conditional'}
              onChange={(v) => selectedNode && onUpdateNode(selectedNode.id, { flowExecution: v })}
              options={[
                { value: 'Sequential', label: 'Sequential' },
                { value: 'Parallel', label: 'Parallel' },
                { value: 'Conditional', label: 'Conditional' },
              ]}
            />
          </div>

          {/* zoom + focus */}
          <div className="absolute top-2.5 right-3 z-20 flex items-center gap-0.5 p-1 rounded-xl bg-white border border-line shadow-[0_6px_20px_-8px_rgba(16,24,40,0.18)]">
            <IconButton className="w-7 h-7" title="Zoom out" onClick={() => zoomBy(-0.1)}>
              <Minus className="w-3.5 h-3.5" />
            </IconButton>
            <button type="button" onClick={() => setAutoFit(true)} title="Fit to screen" className={cx('h-7 min-w-[52px] px-1.5 rounded-md text-[12px] tabular-nums cursor-pointer', autoFit ? 'text-accent font-medium' : 'text-ink-2 hover:bg-subtle')}>
              {autoFit ? 'Fit' : `${Math.round(zoom * 100)}%`}
            </button>
            <IconButton className="w-7 h-7" title="Zoom in" onClick={() => zoomBy(0.1)}>
              <Plus className="w-3.5 h-3.5" />
            </IconButton>
            <span className="w-px h-5 bg-line mx-0.5" />
            <IconButton className="w-7 h-7" title={focus ? 'Exit full screen' : 'Full screen workflow'} active={focus} onClick={() => setFocus((f) => !f)}>
              {focus ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </IconButton>
          </div>

          {connectingFrom && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 h-8 px-3 rounded-lg bg-ink text-white text-[12px] flex items-center gap-2 animate-rise">
              Click a node to connect <span className="text-white/40">Esc to cancel</span>
            </div>
          )}

          {composerOpen && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 w-[560px] rounded-xl bg-white border border-line shadow-[0_20px_50px_-12px_rgba(16,24,40,0.3)] overflow-hidden animate-rise">
              <div className="relative border-b border-line">
                <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input autoFocus value={composerQuery} onChange={(e) => setComposerQuery(e.target.value)} placeholder="Search triggers and actions" className="w-full h-11 pl-10 pr-3 text-[13px] outline-none" />
              </div>
              <div className="grid grid-cols-[168px_1fr] h-[280px]">
                <div className="border-r border-line p-1.5 overflow-y-auto bg-[#fafafb]">
                  {COMPOSER_GROUPS.map((g, i) => (
                    <React.Fragment key={g.id}>
                      {i === 0 && <div className="px-2.5 pt-1.5 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint">Triggers</div>}
                      {i === 2 && <div className="px-2.5 pt-3 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint">Responses</div>}
                      <button
                        type="button"
                        onClick={() => {
                          setComposerGroup(g.id);
                          setComposerQuery('');
                        }}
                        className={cx('w-full h-7 px-2.5 rounded-md text-left text-[12.5px] cursor-pointer', composerGroup === g.id && !composerQuery ? 'bg-white shadow-[0_1px_2px_rgba(16,24,40,0.08)] text-ink font-medium' : 'text-ink-2 hover:bg-black/[0.03]')}
                      >
                        {g.id}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
                <div className="p-2 overflow-y-auto grid grid-cols-2 gap-1 content-start">
                  {composerItems.map(({ g, i }) => {
                    const St = NODE_STYLE[g.trigger ? 'Trigger' : g.id] || NODE_STYLE.State;
                    return (
                      <button key={g.id + i} type="button" onClick={() => addFromComposer(g.id, i, g.trigger)} className="flex items-center gap-2.5 h-10 px-2.5 rounded-lg hover:bg-subtle text-left cursor-pointer">
                        <span className={cx('w-6 h-6 rounded-md flex items-center justify-center shrink-0', St.tint)}>
                          <St.icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[12.5px] truncate">{i}</span>
                      </button>
                    );
                  })}
                  {composerItems.length === 0 && <div className="col-span-2 text-center text-[12.5px] text-muted py-10">No matches</div>}
                </div>
              </div>
            </div>
          )}

          {/* canvas surface */}
          <div
            ref={canvasRef}
            onMouseMove={onCanvasMove}
            onMouseUp={() => setDrag(null)}
            onMouseLeave={() => setDrag(null)}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setComposerOpen(false);
            }}
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                zoomBy(e.deltaY > 0 ? -0.05 : 0.05);
              }
            }}
            className="absolute inset-0 canvas-dots overflow-auto pt-14 pb-10"
          >
            <div ref={contentRef} className="relative mx-auto" style={{ width: W * zoom, height: H * zoom }}>
              <div className="absolute left-0 top-0" style={{ width: W, height: H, transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
                {/* phase lanes */}
                {region && (
                  <div style={{ left: region.x, top: region.y + 6, width: region.w, height: region.h }} className="absolute rounded-2xl border border-dashed border-accent/35 bg-accent/[0.03]">
                    <button type="button" onClick={() => setGroupExpanded(false)} className="absolute right-3 top-2 flex items-center gap-1 text-[11px] font-medium text-accent/70 hover:text-accent cursor-pointer">
                      <ChevronDown className="w-3 h-3" /> Composite
                    </button>
                  </div>
                )}

                <svg className="absolute inset-0 pointer-events-none overflow-visible" width={W} height={H}>
                  <defs>
                    {[
                      ['idle', '#aab1bf'],
                      ['hot', '#2f6bff'],
                      ['live', '#12b76a'],
                      ['cond', '#f0a83a'],
                    ].map(([id, c]) => (
                      <marker key={id} id={`pg-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M0 1 L9 5 L0 9z" fill={c} />
                      </marker>
                    ))}
                  </defs>
                  {connections.map((c) => {
                    const a = nodes.find((n) => n.id === c.fromNodeId);
                    const b = nodes.find((n) => n.id === c.toNodeId);
                    if (!a || !b || !visibleIds.has(a.id) || !visibleIds.has(b.id)) return null;
                    const g = edgeGeom(a, b);
                    const flowing = (live[a.id] === 'done' || live[a.id] === 'active') && (live[b.id] === 'active' || live[b.id] === 'error');
                    const passed = live[a.id] === 'done' && live[b.id] === 'done';
                    const hot = c.fromNodeId === selectedNodeId || c.toNodeId === selectedNodeId;
                    const kind = flowing || passed ? 'live' : c.flowType === 'Conditional' ? 'cond' : hot ? 'hot' : 'idle';
                    const color = { live: '#12b76a', cond: '#f0a83a', hot: '#2f6bff', idle: '#b6bcc8' }[kind];
                    const labelW = c.label.length * 6 + 18;
                    return (
                      <g key={c.id}>
                        <path d={g.d} fill="none" stroke={color} strokeWidth={flowing || hot ? 2.2 : 1.6} className={flowing ? 'edge-flow' : undefined} strokeDasharray={!flowing && c.flowType === 'Parallel' ? '5 4' : undefined} markerEnd={`url(#pg-${kind})`} />
                        <g transform={`translate(${g.mx} ${g.my})`}>
                          <rect x={-labelW / 2} y={-9} width={labelW} height={18} rx={9} fill="#fff" stroke={flowing || passed ? '#a6f4c5' : '#e4e7ec'} />
                          <text textAnchor="middle" y={3.5} fontSize="10.5" fontWeight="500" fill={flowing || passed ? '#067647' : '#5b5f6b'} fontFamily="Inter, sans-serif">
                            {c.label}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>

                {visibleNodes.map((n) => {
                  const St = styleOf(n);
                  const sel = n.id === selectedNodeId;
                  const lv = live[n.id];
                  const order = SEQ.indexOf(n.id);
                  const isGroup = n.id === 'node_comp_open_group';
                  return (
                    <div
                      key={n.id}
                      style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}
                      onMouseDown={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setAutoFit(false);
                        setDrag({ id: n.id, dx: (e.clientX - r.left) / zoom, dy: (e.clientY - r.top) / zoom });
                        selectNode(n);
                      }}
                      className={cx(
                        'absolute rounded-xl bg-white border flex items-center gap-2.5 px-3 cursor-grab active:cursor-grabbing transition-[box-shadow,border-color] duration-300',
                        lv === 'active' && 'border-[#12b76a] shadow-[0_0_0_4px_rgba(18,183,106,0.15),0_10px_24px_-10px_rgba(18,183,106,0.5)]',
                        lv === 'error' && 'border-[#f04438] shadow-[0_0_0_4px_rgba(240,68,56,0.14)]',
                        !lv || lv === 'done' ? (sel ? 'border-accent shadow-[0_0_0_4px_rgba(47,107,255,0.12)]' : 'border-line shadow-[0_1px_3px_rgba(16,24,40,0.07)] hover:border-line-2') : '',
                        sel && lv && lv !== 'done' && 'outline-2 outline-offset-2 outline-accent',
                        sel ? 'z-20' : 'z-10',
                        connectingFrom && connectingFrom !== n.id && 'hover:ring-4 hover:ring-[#f0a83a]/25'
                      )}
                    >
                      {order >= 0 && (
                        <span className={cx('absolute -top-2 -left-2 w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center border', lv === 'done' ? 'bg-[#12b76a] border-[#12b76a] text-white' : lv === 'active' ? 'bg-white border-[#12b76a] text-[#067647]' : 'bg-white border-line-2 text-muted')}>
                          {lv === 'done' ? <Check className="w-3 h-3" /> : order + 1}
                        </span>
                      )}
                      {lv === 'active' && (
                        <span className="absolute -top-2 right-2 h-4 px-1.5 rounded-full bg-[#12b76a] text-white text-[9.5px] font-semibold flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                          {n.id === 'node_trig_tap' && previewState === 'Closed' ? 'Waiting' : n.kind === 'state' ? 'Reached' : 'Running'}
                        </span>
                      )}
                      <span className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-line-2" />
                      <span className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-line-2" />
                      <span className={cx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', n.id === 'node_state_completed' ? 'bg-[#ecfdf3] text-[#067647]' : n.id === 'node_state_error' ? 'bg-[#fef3f2] text-[#b42318]' : St.tint)}>
                        {n.id === 'node_state_completed' ? <Check className="w-4 h-4" /> : n.id === 'node_state_error' ? <TriangleAlert className="w-4 h-4" /> : <St.icon className="w-4 h-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-semibold truncate">{n.label}</div>
                        <div className="text-[11px] text-muted truncate">{subtitleOf(n)}</div>
                      </div>
                      {isGroup && (
                        <button
                          type="button"
                          title={groupExpanded ? 'Collapse' : 'Expand'}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={() => setGroupExpanded((v) => !v)}
                          className="w-5 h-5 rounded flex items-center justify-center text-muted hover:bg-subtle cursor-pointer"
                        >
                          {groupExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="absolute bottom-3 left-4 z-10 flex items-center gap-4 text-[11.5px] text-muted pointer-events-none bg-white/80 backdrop-blur rounded-lg px-2.5 py-1.5 border border-line">
            <span className="flex items-center gap-1.5"><span className="w-4 h-px bg-[#b6bcc8]" />Sequential</span>
            <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-[#b6bcc8]" />Parallel</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-px bg-[#f0a83a]" />Conditional</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#12b76a]" />Live</span>
          </div>
        </div>

        {/* ================= LIVE PREVIEW ================= */}
        {!focus && (
          <div className={cx('shrink-0 bg-night border-t border-night-line flex flex-col transition-[height] duration-300', previewOpen ? 'h-[300px]' : 'h-11')}>
            <div className="h-11 px-4 flex items-center justify-between gap-4 border-b border-night-line shrink-0">
              <div className="flex items-center gap-2.5">
                <button type="button" onClick={() => setPreviewOpen((o) => !o)} className="flex items-center gap-1.5 text-[13px] font-semibold text-white cursor-pointer">
                  {previewOpen ? <ChevronDown className="w-3.5 h-3.5 text-white/50" /> : <ChevronUp className="w-3.5 h-3.5 text-white/50" />}
                  Live preview
                </button>
                <span title="Browser simulation — not real engine execution" className="inline-flex items-center gap-1.5 h-5 px-2 rounded-md bg-[#f79009]/12 text-[#fdb022] text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fdb022]" />
                  Simulated
                </span>
              </div>
              {!isGenericWorkspace ? <div className="hidden lg:flex items-center gap-2">
                {STEPS.map((st, i) => (
                  <React.Fragment key={st}>
                    <button type="button" onClick={() => go(st)} className={cx('flex items-center gap-1.5 text-[11.5px] cursor-pointer transition-colors', i <= stepIdx ? 'text-white' : 'text-white/35 hover:text-white/60')}>
                      <span className={cx('w-1.5 h-1.5 rounded-full', i < stepIdx ? 'bg-[#12b76a]' : i === stepIdx ? 'bg-white ring-4 ring-white/10' : 'bg-white/20')} />
                      {st}
                    </button>
                    {i < STEPS.length - 1 && <span className={cx('w-4 h-px', i < stepIdx ? 'bg-[#12b76a]/60' : 'bg-white/12')} />}
                  </React.Fragment>
                ))}
                {(previewState === 'Error' || previewState === 'Interrupted') && <span className="ml-1 h-5 px-2 rounded-md bg-[#f04438]/15 text-[#fda29b] text-[11px] font-medium inline-flex items-center">{previewState}</span>}
              </div> : <span className="hidden lg:inline text-[11.5px] text-white/45">No preview configured</span>}
              {!isGenericWorkspace ? <div className="flex items-center gap-1.5">
                <SelectInput
                  night
                  className="w-[200px]"
                  value={ec}
                  onChange={(v) => selectScenario(v as EdgeCaseScenarioId)}
                  options={EDGE_CASE_SCENARIOS.map((sc) => ({ value: sc.id, label: sc.id === 'normal' ? 'Scenario: Standard' : sc.label, group: sc.id === 'normal' ? undefined : sc.category }))}
                />
                <IconButton night active={showLog} title="Event log" className="w-7 h-7" onClick={() => setShowLog((v) => !v)}>
                  <Terminal className="w-3.5 h-3.5" />
                </IconButton>
              </div> : <span className="text-[11px] text-white/40">Empty workspace</span>}
            </div>

            {previewOpen && (
              <div className="flex-1 flex min-h-0">
                <div className="flex-1 relative stage-night min-w-0">
                  <div className="absolute inset-0 pb-12 pt-2">
                    {isGenericWorkspace ? <div className="h-full flex flex-col items-center justify-center text-center px-6"><div className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/10 flex items-center justify-center"><Box className="w-6 h-6 text-white/55" /></div><div className="text-[13px] font-medium text-white/80 mt-3">Empty Playground</div><div className="text-[11.5px] text-white/40 mt-1 max-w-[260px]">Add components from the Library to start building this workspace.</div></div> : <RewardStage
                      state={previewState}
                      lidOpen={lidOpen && previewState !== 'Closed'}
                      rewardKind={ec === 'missing_reward_asset' || !rewardAsset ? 'missing' : rewardAsset.visualKind}
                      containerKind={ec === 'missing_opening_anim' ? 'chest_wood_static' : containerAsset?.visualKind}
                      chestColor={config.chestColorHex}
                      trajectory={config.trajectoryType}
                      arcHeight={config.arcHeightPx}
                      quantity={qty}
                      intensity={config.effectIntensity}
                      glow={config.chestGlowIntensity}
                      lidAngle={rot.angleDeg}
                      scale={containerNode?.scaleProps?.scaleX ?? 1}
                      openDurationMs={openMs}
                      reducedMotion={config.reducedMotion}
                      noDestination={noDestination}
                      wallet={wallet}
                      onChestClick={() => fire('Tap')}
                    />}
                  </div>

                  {errorMsg && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-3 pl-3 pr-1.5 py-1.5 rounded-xl bg-[#1c1214]/95 border border-[#f04438]/25 backdrop-blur animate-rise">
                      <TriangleAlert className="w-4 h-4 text-[#f97066] shrink-0" />
                      <div className="text-[12px] leading-tight">
                        <div className="text-white font-medium">{errorMsg.title}</div>
                        <div className="text-white/55">{errorMsg.body}</div>
                      </div>
                      <Button size="sm" variant="night" onClick={errorMsg.fn}>
                        {errorMsg.action}
                      </Button>
                    </div>
                  )}

                  {!isGenericWorkspace && <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="primary" icon={<Play className="w-3 h-3 fill-current" />} onClick={() => fire(config.activeTrigger)}>
                        {config.activeTrigger}
                      </Button>
                      <Button size="sm" variant="night" onClick={tapFive} title="Fire 5 taps rapidly">
                        Tap ×5
                      </Button>
                      <Button size="sm" variant="night" icon={<SkipForward className="w-3 h-3" />} onClick={skip}>
                        Skip
                      </Button>
                      <IconButton night title="Reset" className="w-7 h-7" onClick={reset}>
                        <RotateCcw className="w-3.5 h-3.5" />
                      </IconButton>
                    </div>
                    <button type="button" onClick={() => onOpenReplaceModal('reward_item')} className="flex items-center gap-2 h-7 pl-1.5 pr-2.5 rounded-lg bg-white/[0.06] border border-white/10 hover:bg-white/[0.11] text-[12px] text-white/85 cursor-pointer">
                      <RewardTokenGlyph kind={rewardAsset?.visualKind || 'missing'} size={18} />
                      {short(rewardAsset)}
                      <Replace className="w-3 h-3 text-white/40" />
                    </button>
                  </div>}
                </div>

                {showLog && (
                  <div className="w-[280px] shrink-0 border-l border-night-line flex flex-col">
                    <div className="h-9 px-3 flex items-center justify-between text-[11px] border-b border-night-line">
                      <span className="font-semibold uppercase tracking-[0.06em] text-white/40">Event log</span>
                      <span className="text-white/40 tabular-nums">
                        req {requests} · ignored {debounced}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-0.5">
                      {log.map((l, i) => (
                        <div key={i} className={cx('flex gap-2 px-1.5 py-1 rounded', i === 0 && 'bg-white/[0.04]')}>
                          <span className="text-white/25 tabular-nums">{l.t}</span>
                          <span className={cx('w-[56px] shrink-0 truncate', l.kind === 'err' ? 'text-[#f97066]' : l.kind === 'warn' ? 'text-[#fdb022]' : l.kind === 'ok' ? 'text-[#32d583]' : 'text-[#84adff]')}>{l.src}</span>
                          <span className="text-white/70 break-words min-w-0">{l.msg}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= RIGHT PANEL (Figma-style) ================= */}
      {!focus && (
        <aside className="w-[320px] shrink-0 bg-white border-l border-line flex flex-col min-h-0">
          {/* top: components / assets */}
          <div className="h-[42%] min-h-[230px] flex flex-col border-b border-line">
            <div className="h-11 px-4 border-b border-line flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4 h-full">
                {(['components', 'assets', 'library'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setLeftTab(t)} className={tabBtn(leftTab === t)}>
                    {t}
                    {leftTab === t && tabLine}
                  </button>
                ))}
              </div>
              <IconButton title="Upload asset" className="w-7 h-7" onClick={onOpenImportModal}>
                <Upload className="w-3.5 h-3.5" />
              </IconButton>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5">
              {leftTab === 'components' ? (
                components.map((c) => {
                  const a = assets.find((x) => x.id === c.assignedAssetId);
                  const Icon = SLOT_ICON[c.id];
                  const tone = !a ? (c.required ? 'danger' : 'neutral') : a.compatibility === 'Compatible' ? 'success' : 'warning';
                  const active = selectedSlotId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedSlotId(c.id);
                        const node = nodes.find((n) => n.targetSlotId === c.id);
                        if (node) setSelectedNodeId(node.id);
                        setRightTab('properties');
                      }}
                      className={cx('group flex items-center gap-2.5 h-10 px-2 rounded-lg cursor-pointer transition-colors', active ? 'bg-accent-soft' : 'hover:bg-subtle')}
                    >
                      <div className={cx('w-7 h-7 rounded-md flex items-center justify-center shrink-0', active ? 'bg-white' : 'bg-subtle')}>
                        {a && (c.id === 'reward_item' || c.id === 'reveal_effect') ? <RewardTokenGlyph kind={a.visualKind} size={18} /> : <Icon className={cx('w-3.5 h-3.5', active ? 'text-accent' : 'text-ink-2')} />}
                      </div>
                      <div className="flex-1 min-w-0 leading-tight">
                        <div className="text-[12.5px] font-medium truncate">{c.name}</div>
                        <div className={cx('text-[11px] truncate', a ? 'text-muted' : 'text-[#b42318]')}>{a ? short(a) : c.required ? 'Missing asset' : 'Empty'}</div>
                      </div>
                      <button
                        type="button"
                        title="Replace"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReplaceModal(c.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-muted hover:text-ink hover:bg-white cursor-pointer transition"
                      >
                        <Replace className="w-3.5 h-3.5" />
                      </button>
                      <Dot tone={tone} className="group-hover:hidden" />
                    </div>
                  );
                })
              ) : leftTab === 'library' ? (
                <ComponentLibraryPanel
                  definitions={componentDefinitions}
                  instances={componentInstances}
                  selectedDefinitionId={null}
                  onSelect={() => undefined}
                  onUse={(definitionId) => onCreateComponentInstance(definitionId, undefined)}
                  compact
                />
              ) : (
                <>
                  <div className="px-2 pt-1.5 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">In this skill</div>
                  {assets
                    .filter((a) => components.some((c) => c.assignedAssetId === a.id))
                    .map((a) => (
                      <div key={a.id} className="group flex items-center gap-2.5 h-10 px-2 rounded-lg hover:bg-subtle">
                        <div className="w-7 h-7 rounded-md bg-night flex items-center justify-center shrink-0">
                          <RewardTokenGlyph kind={a.visualKind} size={16} />
                        </div>
                        <div className="flex-1 min-w-0 leading-tight">
                          <div className="text-[12.5px] font-medium truncate">{short(a)}</div>
                          <div className="text-[11px] text-muted font-mono">{a.format}</div>
                        </div>
                        <div className="hidden group-hover:flex">
                          <IconButton title="Replace" className="w-6 h-6" onClick={() => onOpenReplaceModal(a.compatibleSlots[0] || 'reward_item')}>
                            <Replace className="w-3.5 h-3.5" />
                          </IconButton>
                          <IconButton
                            title="Remove from skill (kept in library)"
                            className="w-6 h-6 hover:text-[#b42318]"
                            onClick={() => {
                              onRemoveAssetFromSkill(a.id);
                              push('asset', `${short(a)} unlinked · kept in library`, 'warn');
                            }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </IconButton>
                        </div>
                      </div>
                    ))}
                  <div className="px-2 pt-3 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">Library</div>
                  {assets
                    .filter((a) => !components.some((c) => c.assignedAssetId === a.id))
                    .map((a) => (
                      <div key={a.id} className="group flex items-center gap-2.5 h-10 px-2 rounded-lg hover:bg-subtle">
                        <div className="w-7 h-7 rounded-md bg-subtle flex items-center justify-center shrink-0">
                          <RewardTokenGlyph kind={a.visualKind} size={16} />
                        </div>
                        <div className="flex-1 min-w-0 leading-tight">
                          <div className="text-[12.5px] truncate">{short(a)}</div>
                          <div className="text-[11px] text-muted font-mono">{a.format}</div>
                        </div>
                        {a.compatibleSlots.length > 0 && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="hidden group-hover:inline-flex h-6 px-2"
                            onClick={() => {
                              onAssignAssetToSlot(a.id, a.compatibleSlots[0]);
                              push('asset', `${short(a)} bound`, 'ok');
                            }}
                          >
                            Use
                          </Button>
                        )}
                      </div>
                    ))}
                </>
              )}
            </div>
          </div>

          {/* bottom: inspector */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="px-4 border-b border-line flex items-center gap-4 h-11 shrink-0">
              {(['properties', 'actions', 'variants', 'settings'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setRightTab(t)} className={tabBtn(rightTab === t)}>
                  {t}
                  {rightTab === t && tabLine}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {rightTab === 'properties' && (
                <>
                  <div className="px-4 py-3.5 border-b border-line flex items-center gap-3">
                    <span className={cx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', S.tint)}>
                      <S.icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold truncate">{selectedNode?.label}</div>
                      <div className="text-[11.5px] text-muted truncate">{selectedNode ? subtitleOf(selectedNode) : ''}</div>
                    </div>
                    {selectedNode?.exposedToSchema && <Pill tone="accent">Exposed</Pill>}
                  </div>
                  {selectedNode?.kind === 'state' ? (
                    <Section title="Outcome">
                      <p className="text-[12.5px] text-ink-2 leading-relaxed">
                        {selectedNode.id === 'node_state_completed' ? 'Reached when the host confirms collection. The reward is credited exactly once.' : 'Reached when the host rejects collection. Nothing is credited; retry reuses the same reward ID.'}
                      </p>
                    </Section>
                  ) : (
                    renderProperties()
                  )}
                </>
              )}

              {rightTab === 'actions' && (
                <>
                  <Section title="Trigger">
                    <button type="button" onClick={() => selectNode(nodes.find((n) => n.id === 'node_trig_tap')!)} className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-line hover:border-line-2 cursor-pointer text-left">
                      <span className={cx('w-8 h-8 rounded-lg flex items-center justify-center', NODE_STYLE.Trigger.tint)}>
                        <MousePointerClick className="w-4 h-4" />
                      </span>
                      <div className="flex-1">
                        <div className="text-[13px] font-medium">{config.activeTrigger}</div>
                        <div className="text-[11.5px] text-muted">Reward Container</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-faint" />
                    </button>
                  </Section>
                  <Section
                    title="Responses"
                    action={
                      <Button size="sm" variant="ghost" className="h-6 px-1.5" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setComposerOpen(true)}>
                        Add
                      </Button>
                    }
                  >
                    <div className="space-y-1">
                      <button type="button" onClick={() => setGroupExpanded((v) => !v)} className="w-full flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-subtle cursor-pointer">
                        {groupExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-muted" />}
                        <Layers className="w-3.5 h-3.5 text-accent" />
                        <span className="text-[13px] font-medium flex-1 text-left">Open Reward Container</span>
                        <span className="text-[11px] text-muted">{groupNodes.length - 1}</span>
                      </button>
                      {groupExpanded &&
                        groupNodes
                          .filter((g) => g.id !== 'node_comp_open_group')
                          .map((g) => {
                            const St = styleOf(g);
                            return (
                              <button key={g.id} type="button" onClick={() => selectNode(g)} className={cx('w-full flex items-center gap-2.5 h-9 pl-8 pr-2 rounded-lg cursor-pointer text-left', g.id === selectedNodeId ? 'bg-accent-soft' : 'hover:bg-subtle')}>
                                <St.icon className="w-3.5 h-3.5 text-muted" />
                                <span className="text-[12.5px] flex-1 truncate">{g.label}</span>
                                {live[g.id] === 'active' && <Dot tone="success" />}
                              </button>
                            );
                          })}
                      {nodes
                        .filter((n) => n.kind === 'primitive_action' && !n.parentCompositeId)
                        .map((g) => {
                          const St = styleOf(g);
                          return (
                            <button key={g.id} type="button" onClick={() => selectNode(g)} className="w-full flex items-center gap-2.5 h-9 px-2 rounded-lg hover:bg-subtle cursor-pointer text-left">
                              <St.icon className="w-3.5 h-3.5 text-muted ml-5" />
                              <span className="text-[12.5px] flex-1 truncate">{g.label}</span>
                            </button>
                          );
                        })}
                    </div>
                  </Section>
                </>
              )}

              {rightTab === 'variants' && (
                <>
                  <Section title="Reward item">
                    <div className="grid grid-cols-3 gap-2">
                      {assets
                        .filter((a) => a.compatibleSlots.includes('reward_item'))
                        .map((a) => {
                          const on = rewardAsset?.id === a.id;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => {
                                onAssignAssetToSlot(a.id, 'reward_item');
                                push('variant', `Reward → ${short(a)}`, 'ok');
                              }}
                              className={cx('flex flex-col items-center gap-1.5 py-3 rounded-xl border cursor-pointer transition', on ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-2')}
                            >
                              <RewardTokenGlyph kind={a.visualKind} size={28} />
                              <span className="text-[11.5px] font-medium">{short(a).split(' ').slice(-1)[0]}</span>
                            </button>
                          );
                        })}
                    </div>
                  </Section>
                  <Section title="Container">
                    <div className="grid grid-cols-3 gap-2">
                      {assets
                        .filter((a) => a.compatibleSlots.includes('reward_container'))
                        .map((a) => {
                          const on = containerAsset?.id === a.id;
                          return (
                            <button key={a.id} type="button" onClick={() => onAssignAssetToSlot(a.id, 'reward_container')} className={cx('flex flex-col items-center gap-1.5 py-3 rounded-xl border cursor-pointer', on ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-2')}>
                              <span className="text-[11.5px] font-medium">{a.visualKind === 'gift_box' ? 'Gift box' : a.visualKind === 'chest_wood_static' ? 'Crate' : 'Chest'}</span>
                              <Dot tone={a.compatibility === 'Compatible' ? 'success' : 'warning'} />
                            </button>
                          );
                        })}
                    </div>
                  </Section>
                  <Section title="Presets">
                    <div className="space-y-1.5">
                      {presets.map((p) => (
                        <div key={p.name} className="flex items-center gap-3 p-2.5 rounded-xl border border-line">
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium">{p.name}</div>
                            <div className="text-[11.5px] text-muted">{p.desc}</div>
                          </div>
                          <Button size="sm" variant="secondary" onClick={p.apply}>
                            Apply
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {rightTab === 'settings' && (
                <>
                  <Section title="Skill">
                    <div className="space-y-2 text-[12.5px]">
                      {[
                        ['ID', 'reward-reveal'],
                        ['Bucket', 'Rewards & Collection'],
                        ['Version', `${config.activeVersion} · draft`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between h-7">
                          <span className="text-muted">{k}</span>
                          <span className={k === 'ID' ? 'font-mono text-[12px]' : ''}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                  <Section title="Behavior">
                    <div className="space-y-3.5">
                      <Toggle label="Allow skip" checked={config.skipEnabled} onChange={(v) => onUpdateConfig({ skipEnabled: v })} />
                      <Toggle label="Reduced motion" checked={config.reducedMotion} onChange={(v) => onUpdateConfig({ reducedMotion: v })} />
                      <Toggle label="Sound" checked={config.audioEnabled} onChange={(v) => onUpdateConfig({ audioEnabled: v })} />
                      {config.audioEnabled && <SliderRow label="Volume" value={config.audioVolume} min={0} max={100} unit="%" onChange={(v) => onUpdateConfig({ audioVolume: v })} />}
                    </div>
                  </Section>
                  <Section title="Authority">
                    <p className="text-[12.5px] text-ink-2 leading-relaxed">The host game decides eligibility and credits rewards. This skill only presents and requests.</p>
                  </Section>
                </>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
