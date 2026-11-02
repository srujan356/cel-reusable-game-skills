import React, { useMemo, useState } from 'react';
import { Check, Link2, Replace, Search, Sparkles, Upload, X } from 'lucide-react';
import { AssetCategory, AssetItem, ComponentSlotId, SkillComponentSlot } from '../types/platform';
import { AssetThumbnailGraphic } from './AssetVisuals';
import { Button, Dot, Pill, cx } from './ui';

const CATS: AssetCategory[] = ['3D Models', 'Characters', 'Animation Clips', 'Images and Sprites', 'Textures and Materials', 'Audio', 'Visual Effects'];

interface AssetLibraryViewProps {
  assets: AssetItem[];
  components: SkillComponentSlot[];
  onOpenImportModal: () => void;
  onOpenReplaceModalForSlot: (slotId: ComponentSlotId) => void;
  onAssignAssetToSlot: (assetId: string, slotId: ComponentSlotId) => void;
  onRemoveAssetFromSkill: (assetId: string) => void;
  onOpenPlayground: () => void;
}

const inCat = (a: AssetItem, c: AssetCategory | 'ALL') => {
  if (c === 'ALL') return true;
  if (c === 'Animation Clips') return a.extractedFacts.animationClips.length > 0;
  if (c === 'Textures and Materials') return a.extractedFacts.textures.length > 0;
  if (c === 'Images and Sprites') return ['PNG', 'WebP'].includes(a.format) || a.extractedFacts.textures.some((t) => /png|webp|jpg/i.test(t));
  return a.category === c;
};

export const AssetLibraryView: React.FC<AssetLibraryViewProps> = ({ assets, components, onOpenImportModal, onOpenReplaceModalForSlot, onAssignAssetToSlot, onRemoveAssetFromSkill }) => {
  const [cat, setCat] = useState<AssetCategory | 'ALL'>('ALL');
  const [q, setQ] = useState('');
  const [selId, setSelId] = useState(assets[0]?.id);
  const [toast, setToast] = useState<string | null>(null);

  const list = useMemo(() => assets.filter((a) => inCat(a, cat) && (!q || `${a.name} ${a.filename} ${a.format}`.toLowerCase().includes(q.toLowerCase()))), [assets, cat, q]);
  const sel = assets.find((a) => a.id === selId) || assets[0];
  const used = (id: string) => components.some((c) => c.assignedAssetId === id);
  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2800);
  };

  return (
    <div className="flex-1 flex min-w-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-10 py-8">
          <div className="flex items-end justify-between gap-6 mb-6">
            <div>
              <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Assets</h1>
              <p className="text-[14px] text-muted mt-1">Individual files. Skills reference them — they never own them.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-60">
                <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter assets" className="w-full h-9 pl-9 pr-3 rounded-lg bg-white border border-line-2 text-[13px] outline-none focus:border-accent focus:ring-3 focus:ring-accent/15" />
              </div>
              <Button variant="primary" icon={<Upload className="w-3.5 h-3.5" />} onClick={onOpenImportModal} className="h-9">
                Upload
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-6">
            {(['ALL', ...CATS] as const).map((c) => (
              <button key={c} type="button" onClick={() => setCat(c)} className={cx('h-8 px-3 rounded-full text-[12.5px] font-medium whitespace-nowrap cursor-pointer transition-colors', cat === c ? 'bg-ink text-white' : 'text-ink-2 hover:bg-white hover:shadow-[0_0_0_1px_var(--color-line)]')}>
                {c === 'ALL' ? 'All' : c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelId(a.id)}
                className={cx('text-left rounded-2xl bg-white border overflow-hidden transition-all cursor-pointer', sel?.id === a.id ? 'border-accent ring-4 ring-accent/10' : 'border-line hover:border-line-2 hover:shadow-[0_12px_32px_-16px_rgba(16,24,40,0.2)]')}
              >
                <div className="relative h-32 stage-night flex items-center justify-center">
                  <div className="scale-[1.3]">
                    <AssetThumbnailGraphic visualKind={a.visualKind} accentColor={a.previewColor} />
                  </div>
                  <span className="absolute left-3 top-3 h-5 px-1.5 rounded-md bg-white/[0.08] text-white/70 text-[10.5px] font-mono inline-flex items-center">{a.format}</span>
                  {used(a.id) && <span className="absolute right-3 top-3 h-5 px-1.5 rounded-md bg-accent text-white text-[10.5px] font-medium inline-flex items-center">In skill</span>}
                </div>
                <div className="p-4">
                  <div className="text-[13.5px] font-semibold truncate">{a.name.split(' (')[0]}</div>
                  <div className="flex items-center justify-between mt-1.5 text-[12px] text-muted">
                    <span className="truncate">{a.category}</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <Dot tone={a.inspectionStatus === 'INSPECTED' ? 'success' : 'warning'} />
                      {a.inspectionStatus === 'INSPECTED' ? 'Inspected' : a.inspectionStatus === 'WARNING' ? 'Warning' : 'Review'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {sel && (
        <aside className="w-[360px] shrink-0 bg-white border-l border-line flex flex-col">
          <div className="h-44 stage-night flex items-center justify-center shrink-0">
            <div className="scale-[1.8]">
              <AssetThumbnailGraphic visualKind={sel.visualKind} accentColor={sel.previewColor} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 border-b border-line">
              <h2 className="text-[16px] font-semibold tracking-tight">{sel.name.split(' (')[0]}</h2>
              <div className="text-[12px] font-mono text-muted mt-1 truncate">{sel.filename}</div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Pill tone={sel.compatibility === 'Compatible' ? 'success' : 'warning'}>{sel.compatibility}</Pill>
                <Pill tone={sel.redistributable ? 'neutral' : 'danger'}>{sel.license}</Pill>
              </div>
            </div>

            <div className="p-5 border-b border-line">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold mb-3">
                <Check className="w-3.5 h-3.5 text-[#12b76a]" /> Extracted from file
              </div>
              <dl className="space-y-2 text-[12.5px]">
                {[
                  ['Meshes', sel.extractedFacts.meshes.length || '—'],
                  ['Bones', sel.extractedFacts.boneCount || '—'],
                  ['Clips', sel.extractedFacts.animationClips.length || '—'],
                  ['Lid pivot', sel.extractedFacts.hasSeparateLidMesh ? 'Found' : sel.category === '3D Models' ? 'None' : '—'],
                  ['Materials', sel.extractedFacts.materials.length || '—'],
                  ['Size', `${sel.extractedFacts.fileSizeKB} KB`],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-medium tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="p-5 border-b border-line">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-[12px] font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-[#f79009]" /> AI suggestion
                </span>
                <Pill tone="warning">Unverified</Pill>
              </div>
              <div className="text-[13px] font-medium">{sel.aiSuggestions.possibleAnimationCategory}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 rounded-full bg-subtle overflow-hidden">
                  <div className="h-full bg-[#f79009]" style={{ width: `${sel.aiSuggestions.confidence * 100}%` }} />
                </div>
                <span className="text-[11.5px] text-muted tabular-nums">{Math.round(sel.aiSuggestions.confidence * 100)}%</span>
              </div>
              {sel.aiSuggestions.ambiguityWarning && <p className="text-[12px] text-[#b54708] mt-3 leading-relaxed">Opening capability can’t be verified from this file.</p>}
            </div>

            <div className="p-5">
              <div className="text-[12px] font-semibold mb-3">Confirmed role</div>
              <div className="flex items-center justify-between text-[13px]">
                <span>{sel.creatorConfirmation.confirmedAnimationPurpose}</span>
                {sel.creatorConfirmation.confirmedByCreator ? <Pill tone="success">Confirmed</Pill> : <Pill tone="neutral">Pending</Pill>}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-line space-y-2">
            {toast && <div className="text-[12px] text-[#067647] bg-[#ecfdf3] rounded-lg px-3 py-2 animate-rise">{toast}</div>}
            <div className="flex gap-2">
              {sel.compatibleSlots.length > 0 && !used(sel.id) && (
                <Button
                  variant="primary"
                  className="flex-1"
                  icon={<Link2 className="w-3.5 h-3.5" />}
                  onClick={() => {
                    onAssignAssetToSlot(sel.id, sel.compatibleSlots[0]);
                    flash('Added to skill');
                  }}
                >
                  Add to skill
                </Button>
              )}
              {used(sel.id) && (
                <>
                  <Button className="flex-1" icon={<Replace className="w-3.5 h-3.5" />} onClick={() => onOpenReplaceModalForSlot(sel.compatibleSlots[0] || 'reward_item')}>
                    Replace
                  </Button>
                  <Button
                    className="flex-1"
                    icon={<X className="w-3.5 h-3.5" />}
                    onClick={() => {
                      onRemoveAssetFromSkill(sel.id);
                      flash('Removed from skill · still in your library');
                    }}
                  >
                    Remove from skill
                  </Button>
                </>
              )}
              {sel.compatibleSlots.length === 0 && <div className="text-[12px] text-muted">No compatible slot in this skill.</div>}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
