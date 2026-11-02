import React, { useEffect, useState } from 'react';
import { Check, FileUp, Loader2, Sparkles, ShieldCheck, TriangleAlert } from 'lucide-react';
import { AssetItem, ComponentSlotId } from '../types/platform';
import { AssetThumbnailGraphic } from './AssetVisuals';
import { Button, Field, Modal, ModalHeader, Pill, SelectInput, Stepper, cx, inputCls } from './ui';

interface AssetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: AssetItem[];
  onConfirmAssetImport: (assetId: string, role: ComponentSlotId | 'Actor' | 'Target', purpose: string, openingMode: 'animation_clip' | 'procedural_lid_pivot' | 'none_static', caps: string[], bind: boolean) => void;
  onReimportSkillZip: () => void;
  onImportSkillZipFile?: (file: File) => void;
}

const STAGES = ['Validating file', 'Inspecting structure', 'Extracting metadata', 'Identifying components', 'Inspecting clips & capabilities', 'Generating suggestions'];
const CAPS = ['Play opening clip', 'Lid hinge rotation', 'Color override', 'Trajectory movement', 'Spawn quantity', 'Playback speed', 'Uniform scale'];
const SAMPLES = ['asset_chest_rigged_01', 'asset_flowers_bloom_02', 'asset_crate_static_warn', 'asset_char_mutant_kick'];

export const AssetImportModal: React.FC<AssetImportModalProps> = ({ isOpen, onClose, assets, onConfirmAssetImport, onReimportSkillZip, onImportSkillZipFile }) => {
  const [step, setStep] = useState(0);
  const [pick, setPick] = useState(SAMPLES[0]);
  const [stage, setStage] = useState(0);
  const a = assets.find((x) => x.id === pick) || assets[0];
  const [role, setRole] = useState<string>(a.aiSuggestions.possibleComponentRole);
  const [purpose, setPurpose] = useState(a.creatorConfirmation.confirmedAnimationPurpose);
  const [mode, setMode] = useState(a.creatorConfirmation.openingMechanismMode);
  const [caps, setCaps] = useState<string[]>(['Play opening clip', 'Color override']);
  const [bind, setBind] = useState(true);

  useEffect(() => {
    setRole(a.aiSuggestions.possibleComponentRole);
    setPurpose(a.creatorConfirmation.confirmedAnimationPurpose);
    setMode(a.extractedFacts.animationClips.length ? 'animation_clip' : a.extractedFacts.hasSeparateLidMesh ? 'procedural_lid_pivot' : 'none_static');
  }, [pick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) setStep(0);
  }, [isOpen]);

  // Progress stages sequentially so the animation is visible; each stage maps to a real inspection step.
  useEffect(() => {
    if (step !== 1) return;
    setStage(0);
    const id = setInterval(() => {
      setStage((s) => {
        if (s >= STAGES.length) {
          clearInterval(id);
          return s;
        }
        return s + 1;
      });
    }, 420);
    return () => clearInterval(id);
  }, [step]);

  const f = a.extractedFacts;

  return (
    <Modal open={isOpen} onClose={onClose} width="max-w-[960px]">
      <ModalHeader title="Import asset" onClose={onClose}>
        <Stepper steps={['Upload', 'Analyze', 'Review']} current={step} />
      </ModalHeader>

      <div className="flex-1 overflow-y-auto">
        {step === 0 && (
          <div className="p-6 space-y-6">
            <div className="rounded-2xl border-2 border-dashed border-line-2 hover:border-accent/50 hover:bg-accent-soft/40 transition-colors py-10 text-center cursor-pointer" onClick={() => setStep(1)}>
              <div className="w-11 h-11 rounded-xl bg-accent-soft text-accent flex items-center justify-center mx-auto">
                <FileUp className="w-5 h-5" />
              </div>
              <div className="text-[14px] font-medium mt-3">Drop files here or browse</div>
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {['GLB', 'glTF', 'PNG', 'JPG', 'WebP', 'WAV', 'MP3', 'OGG'].map((x) => (
                  <span key={x} className="h-5 px-1.5 rounded bg-subtle text-[10.5px] font-mono text-muted inline-flex items-center">
                    {x}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[12px] font-semibold text-muted mb-2.5">Or try a sample</div>
              <div className="grid grid-cols-2 gap-2.5">
                {SAMPLES.map((id) => {
                  const s = assets.find((x) => x.id === id)!;
                  const on = pick === id;
                  return (
                    <button key={id} type="button" onClick={() => setPick(id)} className={cx('flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition', on ? 'border-accent ring-4 ring-accent/10' : 'border-line hover:border-line-2')}>
                      <div className="w-12 h-12 rounded-lg stage-night flex items-center justify-center shrink-0">
                        <div className="scale-75">
                          <AssetThumbnailGraphic visualKind={s.visualKind} accentColor={s.previewColor} />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate">{s.filename}</div>
                        <div className="text-[12px] text-muted">
                          {s.format} · {(s.extractedFacts.fileSizeKB / 1024).toFixed(1)} MB
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="py-12 px-6 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl stage-night flex items-center justify-center">
                <div className="scale-75">
                  <AssetThumbnailGraphic visualKind={a.visualKind} accentColor={a.previewColor} />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-medium">{a.filename}</div>
                <div className="h-1.5 rounded-full bg-subtle mt-2 overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-300" style={{ width: `${(stage / STAGES.length) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              {STAGES.map((s, i) => (
                <div key={s} className={cx('flex items-center gap-3 h-9 px-3 rounded-lg text-[13px]', i === stage && 'bg-subtle')}>
                  {i < stage ? <Check className="w-4 h-4 text-[#12b76a]" /> : i === stage ? <Loader2 className="w-4 h-4 text-accent animate-spin" /> : <span className="w-4 h-4 rounded-full border border-line-2" />}
                  <span className={i <= stage ? 'text-ink' : 'text-muted'}>{s}</span>
                </div>
              ))}
            </div>
            {stage >= STAGES.length && (
            <div className="mt-6 rounded-xl border border-line bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12.5px] font-semibold">Findings from inspection data</span>
                <Pill tone="neutral">Seeded sample data</Pill>
              </div>
              <dl className="space-y-2 text-[12.5px]">
                {[
                  ['Meshes', f.meshes.length],
                  ['Skeleton', f.skeleton ? `${f.boneCount} bones` : 'Not available'],
                  ['Lid pivot', f.hasSeparateLidMesh ? 'Found' : 'Not available'],
                  ['Clips', f.animationClips.length],
                  ['Materials', f.materials.length],
                  ['Textures', f.textures.length],
                  ['Size', `${f.fileSizeKB} KB`],
                  ['Suggested role', a.aiSuggestions.possibleComponentRole],
                  ['Confidence', `${Math.round(a.aiSuggestions.confidence * 100)}%`],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between gap-3">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-medium text-right">{v}</dd>
                  </div>
                ))}
              </dl>
              {a.aiSuggestions.ambiguityWarning && (
                <p className="text-[12px] text-[#b54708] mt-3 leading-relaxed">{a.aiSuggestions.ambiguityWarning}</p>
              )}
            </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="p-6 grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-line p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#12b76a]" /> Facts
                </span>
                <Pill tone="success">From file</Pill>
              </div>
              <dl className="space-y-2.5 text-[12.5px]">
                {[
                  ['Meshes', f.meshes.length],
                  ['Skeleton', f.skeleton ? `${f.boneCount} bones` : 'None'],
                  ['Lid pivot', f.hasSeparateLidMesh ? 'Found' : 'None'],
                  ['Clips', f.animationClips.length],
                  ['Duration', f.durationSec ? `${f.durationSec}s` : '—'],
                  ['Materials', f.materials.length],
                  ['Textures', f.textures.length],
                  ['Size', `${f.fileSizeKB} KB`],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-medium tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              {f.animationClips.length > 0 && (
                <div className="mt-4 pt-4 border-t border-line space-y-1.5">
                  {f.animationClips.slice(0, 3).map((c) => (
                    <div key={c.name} className="flex justify-between text-[11.5px] font-mono">
                      <span className="truncate">{c.name}</span>
                      <span className="text-muted">{c.durationSec}s</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#fedf89] bg-[#fffcf5] p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                  <Sparkles className="w-4 h-4 text-[#f79009]" /> Suggestions
                </span>
                <Pill tone="warning">Unverified</Pill>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-[11.5px] text-muted">Category</div>
                  <div className="text-[13px] font-medium mt-0.5">{a.aiSuggestions.possibleAnimationCategory}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[#fef0c7] overflow-hidden">
                      <div className="h-full bg-[#f79009]" style={{ width: `${a.aiSuggestions.confidence * 100}%` }} />
                    </div>
                    <span className="text-[11.5px] text-muted tabular-nums">{Math.round(a.aiSuggestions.confidence * 100)}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] text-muted">Role</div>
                  <div className="text-[13px] font-mono mt-0.5">{a.aiSuggestions.possibleComponentRole}</div>
                </div>
                <div>
                  <div className="text-[11.5px] text-muted mb-1.5">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {a.aiSuggestions.suggestedTags.map((t) => (
                      <span key={t} className="h-5 px-1.5 rounded bg-[#fef0c7] text-[11px] text-[#93370d] inline-flex items-center">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
                {a.aiSuggestions.ambiguityWarning && (
                  <div className="flex gap-2 text-[12px] text-[#b42318] leading-snug">
                    <TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Can’t verify an opening — no clips or separate lid.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-accent/30 bg-accent-soft/40 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-semibold">Your confirmation</span>
                <Pill tone="accent">Required</Pill>
              </div>
              <div className="space-y-3.5 flex-1">
                <Field label="Component role">
                  <SelectInput
                    value={role}
                    onChange={setRole}
                    options={[
                      { value: 'reward_container', label: 'Reward Container' },
                      { value: 'lid_opening_element', label: 'Lid / Opening' },
                      { value: 'reward_item', label: 'Reward Item' },
                      { value: 'reveal_effect', label: 'Reveal Effect' },
                      { value: 'audio_slot', label: 'Audio' },
                      { value: 'Actor', label: 'Character actor' },
                    ]}
                  />
                </Field>
                <Field label="Purpose">
                  <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Opening">
                  <SelectInput
                    value={mode}
                    onChange={(v) => setMode(v as typeof mode)}
                    options={[
                      { value: 'animation_clip', label: 'Use supplied clip', disabled: !f.animationClips.length },
                      { value: 'procedural_lid_pivot', label: 'Rotate lid on pivot', disabled: !f.hasSeparateLidMesh },
                      { value: 'none_static', label: 'Doesn’t open' },
                    ]}
                  />
                </Field>
                <div>
                  <div className="text-[11.5px] text-muted mb-1.5">Expose to users</div>
                  <div className="flex flex-wrap gap-1.5">
                    {CAPS.map((c) => {
                      const on = caps.includes(c);
                      return (
                        <button key={c} type="button" onClick={() => setCaps((p) => (on ? p.filter((x) => x !== c) : [...p, c]))} className={cx('h-6 px-2 rounded-md text-[11.5px] cursor-pointer transition', on ? 'bg-accent text-white' : 'bg-white border border-line text-ink-2 hover:border-line-2')}>
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 text-[12.5px] mt-4 cursor-pointer">
                <input type="checkbox" checked={bind} onChange={(e) => setBind(e.target.checked)} className="accent-accent" />
                Add to current skill
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-line flex items-center justify-between shrink-0">
        {step === 0 ? (
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onImportSkillZipFile) {
                  onImportSkillZipFile(file);
                  onClose();
                }
                e.target.value = '';
              }}
            />
            <span className="inline-flex items-center justify-center h-8 px-3 text-[13px] font-medium text-ink-2 hover:bg-subtle rounded-lg cursor-pointer">
              Re-import .zip package
            </span>
          </label>
        ) : (
          <Button variant="ghost" onClick={() => setStep(0)}>
            Back
          </Button>
        )}
        <div className="flex gap-2">
          <Button onClick={onClose}>Cancel</Button>
          {step === 0 && (
            <Button variant="primary" onClick={() => setStep(1)}>
              Analyze
            </Button>
          )}
          {step === 1 && stage >= STAGES.length && (
            <Button variant="primary" onClick={() => setStep(2)}>
              Continue
            </Button>
          )}
          {step === 2 && (
            <Button
              variant="primary"
              onClick={() => {
                onConfirmAssetImport(a.id, role as ComponentSlotId, purpose, mode, caps, bind);
                onClose();
              }}
            >
              Confirm
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
