import React, { useEffect, useState } from 'react';
import { ArrowRight, Upload } from 'lucide-react';
import { AssetItem, ComponentSlotId, SkillComponentSlot } from '../types/platform';
import { AssetThumbnailGraphic, RewardTokenGlyph } from './AssetVisuals';
import { Button, Dot, Modal, ModalHeader, Segmented, cx } from './ui';

interface AssetReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSlotId: ComponentSlotId;
  onSelectTargetSlot: (slotId: ComponentSlotId) => void;
  components: SkillComponentSlot[];
  assets: AssetItem[];
  onConfirmReplace: (slotId: ComponentSlotId, newAssetId: string) => void;
  onOpenImportModal: () => void;
}

const SLOTS: ComponentSlotId[] = ['reward_item', 'reward_container', 'reveal_effect'];
const short = (a?: AssetItem | null) => (a ? a.name.split(' (')[0] : 'Empty');

function Visual({ a, size = 40 }: { a: AssetItem; size?: number }) {
  return a.compatibleSlots.includes('reward_item') ? (
    <RewardTokenGlyph kind={a.visualKind} size={size} />
  ) : (
    <div style={{ transform: `scale(${size / 40})` }}>
      <AssetThumbnailGraphic visualKind={a.visualKind} accentColor={a.previewColor} />
    </div>
  );
}

export const AssetReplacementModal: React.FC<AssetReplacementModalProps> = ({ isOpen, onClose, targetSlotId, onSelectTargetSlot, components, assets, onConfirmReplace, onOpenImportModal }) => {
  const slotId = SLOTS.includes(targetSlotId) ? targetSlotId : 'reward_item';
  const slot = components.find((c) => c.id === slotId)!;
  const current = assets.find((a) => a.id === slot?.assignedAssetId) || null;
  const options = assets.filter((a) => a.compatibleSlots.includes(slotId));
  const [pick, setPick] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const preferred = slotId === 'reward_item' && current?.id === 'asset_coins_gold_01' ? 'asset_flowers_bloom_02' : options.find((o) => o.id !== current?.id)?.id;
    setPick(preferred || options[0]?.id || '');
  }, [isOpen, slotId]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = options.find((o) => o.id === pick) || null;

  return (
    <Modal open={isOpen} onClose={onClose} width="max-w-[720px]">
      <ModalHeader title="Replace asset" subtitle={`Choose a compatible asset for ${slot?.name}`} onClose={onClose} />

      <div className="px-6 pt-5">
        <Segmented
          value={slotId}
          onChange={onSelectTargetSlot}
          options={SLOTS.map((s) => ({ value: s, label: components.find((c) => c.id === s)?.name || s }))}
        />
      </div>

      <div className="px-6 py-5 overflow-y-auto">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-night mb-5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">{current ? <Visual a={current} size={28} /> : <RewardTokenGlyph kind="missing" size={28} />}</div>
            <div className="min-w-0">
              <div className="text-[11px] text-white/40">Current</div>
              <div className="text-[13.5px] text-white font-medium truncate">{short(current)}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-white/30 shrink-0" />
          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end text-right">
            <div className="min-w-0">
              <div className="text-[11px] text-white/40">New</div>
              <div className="text-[13.5px] text-white font-medium truncate">{short(next)}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/20 ring-1 ring-accent/50 flex items-center justify-center shrink-0">{next && <Visual a={next} size={28} />}</div>
          </div>
        </div>

        <div className={cx('grid gap-3', slotId === 'reward_item' ? 'grid-cols-5' : 'grid-cols-3')}>
          {options.map((o) => {
            const on = o.id === pick;
            return (
              <button key={o.id} type="button" onClick={() => setPick(o.id)} className={cx('relative flex flex-col items-center gap-2.5 pt-5 pb-3.5 px-2 rounded-2xl border cursor-pointer transition-all', on ? 'border-accent ring-4 ring-accent/10 bg-accent-soft/40' : 'border-line hover:border-line-2 hover:bg-subtle/60')}>
                {current?.id === o.id && <span className="absolute top-2 left-2 text-[10px] font-medium text-muted">Current</span>}
                <div className="h-12 flex items-center justify-center">
                  <Visual a={o} size={40} />
                </div>
                <div className="text-center">
                  <div className="text-[12.5px] font-medium leading-tight">{short(o).split(' ').slice(-1)[0]}</div>
                  <div className="flex items-center justify-center gap-1 mt-1 text-[11px] text-muted">
                    <Dot tone={o.compatibility === 'Compatible' ? 'success' : 'warning'} />
                    {o.format}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-line flex items-center justify-between">
        <Button
          variant="ghost"
          icon={<Upload className="w-3.5 h-3.5" />}
          onClick={() => {
            onClose();
            onOpenImportModal();
          }}
        >
          Upload new
        </Button>
        <div className="flex items-center gap-3">
          {current && next && current.id !== next.id && <span className="text-[12px] text-muted">{short(current).split(' ').slice(-1)[0]} stays in your library</span>}
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!next || next.id === current?.id}
            onClick={() => {
              if (next) onConfirmReplace(slotId, next.id);
              onClose();
            }}
          >
            Replace
          </Button>
        </div>
      </div>
    </Modal>
  );
};
