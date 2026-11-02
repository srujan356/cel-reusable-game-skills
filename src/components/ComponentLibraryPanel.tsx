import React, { useMemo, useState } from 'react';
import { ArrowLeft, Box, CheckCircle2, Coins, Grid3x3, Move, MousePointerClick, Package, PanelTop, Search, Settings2, Sparkles, Square, Target, User, Volume2 } from 'lucide-react';
import { ComponentDefinition, ComponentInstance } from '../types/platform';
import { COMPONENT_CATEGORIES } from '../data/componentDefinitions';
import { Button, Pill, cx } from './ui';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = { MousePointerClick, Square, Move, Grid3x3, User, Target, Box, Package, PanelTop, Coins, Sparkles, Volume2 };

interface Props {
  definitions: ComponentDefinition[];
  instances: ComponentInstance[];
  selectedDefinitionId: string | null;
  onSelect: (definitionId: string) => void;
  onUse: (definitionId: string) => void;
  compact?: boolean;
}

const matchesSearch = (definition: ComponentDefinition, query: string) => {
  if (!query.trim()) return true;
  const value = query.toLowerCase();
  return [definition.name, definition.purpose, definition.description, ...definition.tags].some((part) => part.toLowerCase().includes(value));
};

export const ComponentLibraryPanel: React.FC<Props> = ({ definitions, instances, selectedDefinitionId, onSelect, onUse, compact = false }) => {
  const [q, setQ] = useState('');
  const selected = definitions.find((definition) => definition.definitionId === selectedDefinitionId) || null;
  const filteredDefinitions = useMemo(() => definitions.filter((definition) => matchesSearch(definition, q)), [definitions, q]);

  if (selected) {
    const Icon = ICONS[selected.icon] || Box;
    const instanceCount = instances.filter((instance) => instance.definitionId === selected.definitionId).length;
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => onSelect('')} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-ink transition-colors cursor-pointer"><ArrowLeft className="w-3.5 h-3.5" />Back to components</button>
        <div className="rounded-2xl border border-line bg-white overflow-hidden">
          <div className="p-6 flex items-start justify-between gap-5 border-b border-line bg-subtle/50">
            <div className="flex items-start gap-4 min-w-0"><div className="w-14 h-14 rounded-2xl stage-night flex items-center justify-center shrink-0"><Icon className="w-7 h-7 text-white/90" /></div><div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><h2 className="text-[20px] font-semibold tracking-[-0.02em]">{selected.name}</h2><Pill tone="accent">{selected.category}</Pill></div><p className="text-[13px] text-muted mt-1.5 max-w-2xl leading-relaxed">{selected.description}</p><div className="flex items-center gap-2 mt-3"><Pill tone="neutral">Preview: {selected.previewSupport}</Pill><span className="text-[11.5px] text-muted">{instanceCount} instance{instanceCount === 1 ? '' : 's'} in workspaces</span></div></div></div>
            <Button variant="primary" onClick={() => onUse(selected.definitionId)}>Use component</Button>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InspectorSection title="Properties"><div className="space-y-2">{selected.exposedProperties.length ? selected.exposedProperties.map((property) => <div key={property.id} className="flex items-center justify-between gap-4 rounded-lg bg-subtle px-3 py-2.5"><span className="text-[12.5px] text-ink-2">{property.label}</span><span className="text-[11.5px] font-mono text-muted">{String(property.defaultValue)}</span></div>) : <EmptyValue />}</div></InspectorSection>
            <InspectorSection title="Compatible actions"><PillList values={selected.compatibleActionTypes} tone="accent" /></InspectorSection>
            <InspectorSection title="Variants"><div className="flex flex-wrap gap-2">{selected.supportedStates.map((state) => <div key={state} className="inline-flex items-center gap-1.5 text-[12px] text-ink-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#12b76a]" />{state}</div>)}</div></InspectorSection>
            <InspectorSection title="Settings" icon={<Settings2 className="w-3.5 h-3.5" />}><div className="space-y-3 text-[12px] text-ink-2"><DetailRow label="Triggers" value={selected.supportedTriggers.join(', ') || 'No trigger'} /><DetailRow label="Inputs" value={selected.inputs.join(', ') || 'None'} /><DetailRow label="Outputs" value={selected.outputs.join(', ') || 'None'} /><DetailRow label="Dependencies" value={selected.dependencies.join(', ') || 'None'} /></div></InspectorSection>
            <InspectorSection title="Compatibility and limitations" className="lg:col-span-2"><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="rounded-lg border border-[#b2ddff] bg-[#eff8ff] p-3 text-[12px] text-[#175cd3]">{selected.compatibilityNotes}</div><div className="rounded-lg border border-line bg-subtle p-3 text-[12px] text-ink-2">{selected.limitations}</div></div></InspectorSection>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative"><Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" /><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search components" aria-label="Search components" className="w-full h-10 pl-9 pr-3 rounded-lg bg-white border border-line-2 text-[13px] outline-none focus:border-accent focus:ring-3 focus:ring-accent/15 transition" /></div>
      {COMPONENT_CATEGORIES.map((category) => {
        const categoryDefinitions = filteredDefinitions.filter((definition) => definition.category === category);
        if (!categoryDefinitions.length) return null;
        return <section key={category} aria-labelledby={`component-category-${category}`}><div className={cx('flex items-center justify-between', compact ? 'mb-2' : 'mb-2.5')}><h2 id={`component-category-${category}`} className={cx('font-semibold uppercase tracking-[0.08em] text-muted', compact ? 'text-[9.5px]' : 'text-[11px]')}>{category}</h2><span className={cx('text-faint', compact ? 'text-[9.5px]' : 'text-[11px]')}>{categoryDefinitions.length} component{categoryDefinitions.length === 1 ? '' : 's'}</span></div><div className={cx('grid', compact ? 'grid-cols-3 gap-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4')}>{categoryDefinitions.map((definition) => { const Icon = ICONS[definition.icon] || Box; return compact ? <button key={definition.definitionId} type="button" aria-label={`Use ${definition.name}`} onClick={() => onUse(definition.definitionId)} className="group min-w-0 h-[154px] rounded-xl bg-white border border-line overflow-hidden text-left transition-all hover:-translate-y-0.5 hover:border-line-2 hover:shadow-[0_10px_24px_-14px_rgba(10,24,40,0.26)] cursor-pointer"><div className="h-[82px] stage-night flex items-center justify-center"><div className="w-10 h-10 rounded-lg bg-white/[0.08] flex items-center justify-center"><Icon className="w-[19px] h-[19px] text-white/85" /></div></div><div className="px-2 py-2"><div className="text-[11.5px] font-semibold leading-[1.15] line-clamp-2">{definition.name}</div><div className="text-[9.5px] text-muted mt-1">Use</div></div></button> : <article key={definition.definitionId} className="group min-h-[226px] rounded-2xl bg-white border border-line overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-16px_rgba(10,24,40,0.2)] hover:border-line-2 flex flex-col"><button type="button" onClick={() => onSelect(definition.definitionId)} className="text-left flex-1 cursor-pointer"><div className="h-24 stage-night flex items-center justify-center"><div className="w-12 h-12 rounded-xl bg-white/[0.08] flex items-center justify-center"><Icon className="w-6 h-6 text-white/85" /></div></div><div className="p-4"><h3 className="text-[13px] font-semibold leading-snug">{definition.name}</h3><p className="text-[11.5px] text-muted leading-relaxed mt-1 line-clamp-2">{definition.purpose}</p></div></button><div className="px-4 pb-4 flex items-center justify-between gap-3"><Pill tone="neutral">{definition.previewSupport}</Pill><div className="flex items-center gap-1.5"><Button size="sm" variant="secondary" onClick={() => onSelect(definition.definitionId)}>Inspect</Button><Button size="sm" variant="primary" onClick={() => onUse(definition.definitionId)}>Use</Button></div></div></article>; })}</div></section>;
      })}
      {!filteredDefinitions.length && <div className="rounded-xl border border-dashed border-line-2 bg-white p-10 text-center text-[13px] text-muted">No components match “{q}”.</div>}
    </div>
  );
};

function InspectorSection({ title, icon, className, children }: { title: string; icon?: React.ReactNode; className?: string; children: React.ReactNode }) { return <section className={cx('min-w-0', className)}><h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted mb-3">{icon}{title}</h3>{children}</section>; }
function PillList({ values, tone }: { values: string[]; tone: 'accent' | 'neutral' }) { return values.length ? <div className="flex flex-wrap gap-1.5">{values.map((value) => <Pill key={value} tone={tone}>{value}</Pill>)}</div> : <EmptyValue />; }
function DetailRow({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4"><span className="text-muted">{label}</span><span className="text-right">{value}</span></div>; }
function EmptyValue() { return <span className="text-[12px] text-muted">None defined</span>; }
