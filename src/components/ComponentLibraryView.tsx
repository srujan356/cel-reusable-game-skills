import React, { useState } from 'react';
import { CalendarDays, ChevronRight, FolderOpen, Plus, Sparkles } from 'lucide-react';
import { ComponentDefinition, ComponentInstance, Playground, SkillCardItem } from '../types/platform';
import { ComponentLibraryPanel } from './ComponentLibraryPanel';
import { Button, Modal, ModalHeader, inputCls } from './ui';

interface Props {
  definitions: ComponentDefinition[];
  instances: ComponentInstance[];
  skills: SkillCardItem[];
  playgrounds: Playground[];
  activePlaygroundId: string;
  onUseComponent: (definitionId: string, destination: { type: 'existing'; playgroundId: string } | { type: 'new'; name: string }) => void;
  onCreatePlayground: (name: string) => void;
}

export const ComponentLibraryView: React.FC<Props> = ({ definitions, instances, skills, playgrounds, activePlaygroundId, onUseComponent, onCreatePlayground }) => {
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>(null);
  const [pendingDefinitionId, setPendingDefinitionId] = useState<string | null>(null);
  const [isNewPlaygroundDialogOpen, setIsNewPlaygroundDialogOpen] = useState(false);
  const [destinationType, setDestinationType] = useState<'existing' | 'new'>('existing');
  const [selectedPlaygroundId, setSelectedPlaygroundId] = useState(activePlaygroundId || playgrounds[0]?.id || '');
  const [newPlaygroundName, setNewPlaygroundName] = useState('New Component Playground');

  const openUseDialog = (definitionId: string) => {
    setPendingDefinitionId(definitionId);
    setIsNewPlaygroundDialogOpen(false);
    setDestinationType('existing');
    setSelectedPlaygroundId(activePlaygroundId || playgrounds[0]?.id || '');
    setNewPlaygroundName('New Component Playground');
  };
  const openNewPlaygroundDialog = () => {
    setPendingDefinitionId(null);
    setIsNewPlaygroundDialogOpen(true);
    setDestinationType('new');
    setNewPlaygroundName('New Playground');
  };
  const closeUseDialog = () => {
    setPendingDefinitionId(null);
    setIsNewPlaygroundDialogOpen(false);
  };
  const selectedDefinition = definitions.find((definition) => definition.definitionId === pendingDefinitionId);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1180px] mx-auto px-10 py-8">
        <div className="flex items-start justify-between gap-6"><div><h1 className="text-[26px] font-semibold tracking-[-0.02em]">Components</h1><p className="text-[14px] text-muted mt-1">Reusable building blocks. Browse the library, inspect a definition, then choose a Playground.</p></div><div className="flex items-center gap-3"><Button variant="secondary" icon={<Plus className="w-3.5 h-3.5" />} onClick={openNewPlaygroundDialog}>New Playground</Button><div className="hidden md:flex items-center gap-2 rounded-lg bg-subtle px-3 py-2 text-[11.5px] text-muted"><Sparkles className="w-3.5 h-3.5 text-accent" />{playgrounds.length} Playground{playgrounds.length === 1 ? '' : 's'} available</div></div></div>
        <div className="mt-7"><ComponentLibraryPanel definitions={definitions} instances={instances} selectedDefinitionId={selectedDefinitionId} onSelect={(definitionId) => setSelectedDefinitionId(definitionId || null)} onUse={openUseDialog} /></div>
      </div>

      <Modal open={!!pendingDefinitionId || isNewPlaygroundDialogOpen} onClose={closeUseDialog} width="max-w-2xl">
        <ModalHeader title={pendingDefinitionId ? 'Where would you like to use this component?' : 'Create New Playground'} subtitle={selectedDefinition ? `${selectedDefinition.name} will be added as a new independent instance.` : 'Start with a clean, empty workspace.'} onClose={closeUseDialog} />
        <div className="p-6 space-y-4 overflow-y-auto">
          {pendingDefinitionId && <div className="grid grid-cols-2 gap-3"><DestinationChoice active={destinationType === 'existing'} onClick={() => setDestinationType('existing')} icon={<FolderOpen className="w-4 h-4" />} title="Existing Playgrounds" description="Add to a saved workspace" /><DestinationChoice active={destinationType === 'new'} onClick={() => setDestinationType('new')} icon={<Plus className="w-4 h-4" />} title="Create New Playground" description="Start an independent workspace" /></div>}
          {destinationType === 'existing' ? <div className="space-y-2" aria-label="Existing Playgrounds">{playgrounds.length ? playgrounds.map((playground) => { const skill = skills.find((item) => item.id === playground.skillId); const selected = selectedPlaygroundId === playground.id; return <button key={playground.id} type="button" onClick={() => setSelectedPlaygroundId(playground.id)} className={`w-full text-left rounded-xl border p-3.5 flex items-center gap-3 transition-colors cursor-pointer ${selected ? 'border-accent bg-accent-soft/45' : 'border-line hover:border-line-2 hover:bg-subtle'}`}><span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected ? 'bg-accent text-white' : 'bg-subtle text-muted'}`}><FolderOpen className="w-4 h-4" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="text-[13px] font-medium truncate">{playground.name}</span>{selected && <span className="text-[10.5px] font-medium text-accent">Selected</span>}</span><span className="flex items-center gap-3 mt-1 text-[11.5px] text-muted flex-wrap"><span>{skill?.name || 'Independent workspace'}</span>{playground.gameContext && <span>· {playground.gameContext}</span>}<span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" />{playground.lastModified}</span></span></span><ChevronRight className="w-4 h-4 text-faint shrink-0" /></button>; }) : <div className="rounded-xl border border-dashed border-line-2 p-6 text-center text-[12.5px] text-muted">No saved Playgrounds yet. Create one to continue.</div>}</div> : <div className="rounded-xl border border-line bg-subtle/60 p-4"><label className="block text-[12px] font-medium text-ink-2 mb-2" htmlFor="new-playground-name">Playground name</label><input id="new-playground-name" value={newPlaygroundName} onChange={(event) => setNewPlaygroundName(event.target.value)} autoFocus className={inputCls} /><p className="text-[11.5px] text-muted mt-2">This creates a separate workspace and leaves every existing Skill and Playground unchanged.</p></div>}
        </div>
        <div className="px-6 py-4 border-t border-line flex justify-end gap-2"><Button onClick={closeUseDialog}>Cancel</Button><Button variant="primary" disabled={destinationType === 'existing' ? !selectedPlaygroundId : !newPlaygroundName.trim()} onClick={() => { if (pendingDefinitionId) { onUseComponent(pendingDefinitionId, destinationType === 'existing' ? { type: 'existing', playgroundId: selectedPlaygroundId } : { type: 'new', name: newPlaygroundName.trim() }); } else { onCreatePlayground(newPlaygroundName.trim()); } closeUseDialog(); }}>{pendingDefinitionId ? 'Use component' : 'Create Playground'}</Button></div>
      </Modal>
    </div>
  );
};

function DestinationChoice({ active, onClick, icon, title, description }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; description: string }) {
  return <button type="button" onClick={onClick} className={`text-left rounded-xl border p-3 transition-colors cursor-pointer ${active ? 'border-accent bg-accent-soft/45' : 'border-line hover:border-line-2 hover:bg-subtle'}`}><span className={`inline-flex w-7 h-7 rounded-lg items-center justify-center ${active ? 'bg-accent text-white' : 'bg-subtle text-muted'}`}>{icon}</span><span className="block text-[12.5px] font-semibold mt-2">{title}</span><span className="block text-[11px] text-muted mt-0.5">{description}</span></button>;
}
