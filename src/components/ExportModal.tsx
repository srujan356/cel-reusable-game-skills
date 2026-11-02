import React, { useState } from 'react';
import { Check, Code2, Copy, FileArchive, FileText, Lock, RefreshCw, TriangleAlert } from 'lucide-react';
import { AssetItem, PlaygroundConfiguration, SkillComponentSlot } from '../types/platform';
import { Button, Modal, ModalHeader, Pill, Segmented, cx } from './ui';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PlaygroundConfiguration;
  components: SkillComponentSlot[];
  assets: AssetItem[];
  validationStatus: { valid: boolean; warningCount: number; message: string };
  onReimportPackage: () => void;
  onExportZip?: () => void;
}

type Opt = 'zip' | 'prompt' | 'code' | 'unity' | 'unreal';

const OPTIONS: { id: Opt; name: string; ext: string; icon: React.ElementType; status: 'ready' | 'template' | 'future' }[] = [
  { id: 'zip', name: 'Skill package', ext: '.zip', icon: FileArchive, status: 'ready' },
  { id: 'prompt', name: 'AI agent prompt', ext: '.md', icon: FileText, status: 'ready' },
  { id: 'code', name: 'Code export', ext: 'template', icon: Code2, status: 'template' },
  { id: 'unity', name: 'Unity SDK', ext: 'plugin', icon: Lock, status: 'future' },
  { id: 'unreal', name: 'Unreal SDK', ext: 'plugin', icon: Lock, status: 'future' },
];

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, config, components, assets, validationStatus, onReimportPackage, onExportZip }) => {
  const [opt, setOpt] = useState<Opt>('zip');
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [target, setTarget] = useState<'ts' | 'cs'>('ts');

  const asset = (id: string) => assets.find((a) => a.id === components.find((c) => c.id === id)?.assignedAssetId);
  const container = asset('reward_container');
  const reward = asset('reward_item');
  const bound = components.filter((c) => c.assignedAssetId);
  const licensesOk = bound.every((c) => assets.find((a) => a.id === c.assignedAssetId)?.redistributable);
  const name = `reward-reveal-v${config.activeVersion}`;

  const checks = [
    { label: 'Required slots bound', ok: components.filter((c) => c.required).every((c) => c.assignedAssetId) },
    { label: 'Opening implementation valid', ok: container?.visualKind !== 'chest_wood_static' },
    { label: 'Property values in range', ok: config.rewardQuantity > 0 && config.rewardQuantity <= 50 },
    { label: 'Licenses allow redistribution', ok: licensesOk },
  ];
  const canExport = checks.every((c) => c.ok);

  const prompt = `# Reward Reveal v${config.activeVersion} — agent handoff
> Specification only. Not executable.

## Purpose
Present an earned reward: open ${container?.filename ?? 'container'}, reveal ${config.rewardQuantity}× ${reward?.filename ?? 'reward'}, move along a ${config.trajectoryType} path, request collection.

## Authority
Host decides eligibility and credits via CollectReward(hostRewardId).

## States
Closed → Opening → Revealed → Collecting → Completed | Interrupted | Error

## Must handle
- Repeated taps: open once
- Skip while opening: fast-forward, keep reward
- Skip while collecting: no duplicate request
- Host failure: retry with same key`;

  const code =
    target === 'ts'
      ? `// Generated template — review and test before use
export const rewardReveal = {
  skillId: "reward-reveal",
  version: "${config.activeVersion}",
  container: "${container?.filename ?? ''}",
  rewardItem: "${reward?.filename ?? ''}",
  quantity: ${config.rewardQuantity},
  trajectory: "${config.trajectoryType}",
  durationMs: ${config.durationMs},
  skipEnabled: ${config.skipEnabled},
} as const;

export interface HostRewardAuthority {
  requestCollection(rewardId: string): Promise<{ credited: boolean }>;
}`
      : `// Generated stub — review and implement in your engine
public sealed class RewardRevealConfig {
    public const string SkillId = "reward-reveal";
    public const string Version = "${config.activeVersion}";
    public string Container = "${container?.filename ?? ''}";
    public string RewardItem = "${reward?.filename ?? ''}";
    public int Quantity = ${config.rewardQuantity};
}`;

  const copy = (t: string) => {
    navigator.clipboard?.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const close = () => {
    setDone(false);
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={close} width="max-w-[880px]">
      <ModalHeader title="Export" subtitle={`Reward Reveal · v${config.activeVersion}`} onClose={close} />
      <div className="flex flex-1 min-h-0">
        <div className="w-[230px] shrink-0 border-r border-line p-3 space-y-1 bg-[#fafafb]">
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                setOpt(o.id);
                setDone(false);
              }}
              className={cx('w-full flex items-center gap-3 p-2.5 rounded-xl text-left cursor-pointer transition', opt === o.id ? 'bg-white shadow-[0_1px_3px_rgba(16,24,40,0.08)] ring-1 ring-line' : 'hover:bg-black/[0.03]', o.status === 'future' && 'opacity-60')}
            >
              <span className={cx('w-8 h-8 rounded-lg flex items-center justify-center', opt === o.id ? 'bg-accent-soft text-accent' : 'bg-subtle text-muted')}>
                <o.icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium">{o.name}</div>
                <div className="text-[11.5px] text-muted">{o.status === 'future' ? 'Coming later' : o.ext}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 p-6 overflow-y-auto min-h-[420px]">
          {opt === 'zip' && !done && (
            <div className="space-y-6">
              <div>
                <div className="text-[13px] font-semibold mb-3">Validation</div>
                <div className="space-y-2">
                  {checks.map((c) => (
                    <div key={c.label} className="flex items-center gap-2.5 text-[13px]">
                      <span className={cx('w-5 h-5 rounded-full flex items-center justify-center', c.ok ? 'bg-[#ecfdf3] text-[#12b76a]' : 'bg-[#fef3f2] text-[#f04438]')}>{c.ok ? <Check className="w-3 h-3" /> : <TriangleAlert className="w-3 h-3" />}</span>
                      <span className={c.ok ? 'text-ink' : 'text-[#b42318]'}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[13px] font-semibold mb-3">Contents</div>
                <div className="rounded-xl bg-night p-4 font-mono text-[12px] leading-[1.8] text-white/70">
                  <div className="text-white">{name}/</div>
                  {['manifest.json', 'assets/', 'behavior/', 'configuration/', 'compatibility/', 'licenses/', 'documentation/'].map((f, i, arr) => (
                    <div key={f}>
                      <span className="text-white/25">{i === arr.length - 1 ? '└─ ' : '├─ '}</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-[#fef3f2] border border-[#f04438]/50 p-3 mb-4">
                <p className="text-[13px] font-medium text-[#b42318]">
                  <strong>⚠ This package is a transport format only.</strong> It contains skill configuration, asset metadata, and a suggested host contract.
                  Running it in a game requires an engine adapter that implements the host‑authoritative CollectReward handshake,
                  manages wallet/inventory credit, and provides compatible component binaries. The prototype's simulated host
                  is not a real game backend.
                </p>
              </div>
            </div>
          )}

          {opt === 'zip' && done && (
            <div className="h-full flex flex-col items-center justify-center text-center py-6 animate-rise">
              <div className="w-12 h-12 rounded-full bg-[#ecfdf3] text-[#12b76a] flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <div className="text-[17px] font-semibold mt-4">{name}.zip</div>
              <div className="text-[13px] text-muted mt-1">4.5 MB · ready to share</div>
              <div className="grid grid-cols-4 gap-2 mt-6 w-full max-w-md">
                {[
                  [bound.length, 'Assets'],
                  [components.length, 'Slots'],
                  [6, 'Links'],
                  [5, 'Variants'],
                ].map(([v, l]) => (
                  <div key={l as string} className="rounded-xl bg-subtle py-3">
                    <div className="text-[18px] font-semibold tabular-nums">{v}</div>
                    <div className="text-[11.5px] text-muted">{l}</div>
                  </div>
                ))}
              </div>
              <div className="text-[12px] text-muted mt-5">Attribution @evance_ta · licenses included</div>
              <Button
                className="mt-5"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={() => {
                  onReimportPackage();
                  close();
                }}
              >
                Re-import to test
              </Button>
            </div>
          )}

          {opt === 'prompt' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-semibold">Preview</span>
                <Button size="sm" variant="ghost" icon={<Copy className="w-3.5 h-3.5" />} onClick={() => copy(prompt)}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <pre className="rounded-xl bg-night p-4 font-mono text-[12px] leading-relaxed text-white/75 whitespace-pre-wrap">{prompt}</pre>
            </div>
          )}

          {opt === 'code' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Segmented
                  value={target}
                  onChange={setTarget}
                  options={[
                    { value: 'ts', label: 'TypeScript' },
                    { value: 'cs', label: 'C# stub' },
                  ]}
                />
                <Button size="sm" variant="ghost" icon={<Copy className="w-3.5 h-3.5" />} onClick={() => copy(code)}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <pre className="rounded-xl bg-night p-4 font-mono text-[12px] leading-relaxed text-white/75 overflow-x-auto">{code}</pre>
              <p className="text-[12.5px] text-muted mt-3">Generated code needs engineering review and tests.</p>
            </div>
          )}

          {(opt === 'unity' || opt === 'unreal') && (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-12 h-12 rounded-full bg-subtle text-muted flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-[15px] font-semibold mt-4">{opt === 'unity' ? 'Unity' : 'Unreal'} SDK isn’t available yet</div>
              <p className="text-[13px] text-muted mt-1 max-w-xs">It needs a tested engine adapter. Use the skill package for now.</p>
              <Pill tone="neutral" className="mt-4">
                Planned · Release 2
              </Pill>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-line flex items-center justify-between">
        <span className={cx('text-[12.5px]', validationStatus.valid ? 'text-muted' : 'text-[#b42318]')}>{validationStatus.message}</span>
        <div className="flex gap-2">
          <Button onClick={close}>Close</Button>
          {opt === 'zip' && !done && (
            <Button variant="primary" disabled={!canExport} onClick={() => {
                 if (onExportZip) onExportZip();
                 setDone(true);
               }}>
              Export .zip
            </Button>
          )}
          {opt === 'prompt' && (
            <Button variant="primary" onClick={() => copy(prompt)}>
              Download .md
            </Button>
          )}
          {opt === 'code' && (
            <Button variant="primary" onClick={() => copy(code)}>
              Export template
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
