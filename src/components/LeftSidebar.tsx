import React from 'react';
import { Boxes, ChevronsUpDown, Clock, FilePen, FileCode2, Images, Library, Sliders, Users, Play } from 'lucide-react';
import { MainViewId, MyWorkSubFilter } from './TopBar';
import { Avatar, cx } from './ui';

interface LeftSidebarProps {
  activeView: MainViewId;
  myWorkFilter: MyWorkSubFilter;
  onSelectView: (view: MainViewId, filter?: MyWorkSubFilter) => void;
  assetCount: number;
  skillCount: number;
  activeRewardName: string;
  activePlaygroundName: string;
  compact?: boolean;
}

function NavItem({ icon, label, meta, active, onClick }: { icon: React.ReactNode; label: string; meta?: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'w-full h-8 px-2.5 rounded-lg flex items-center gap-2.5 text-[13px] transition-all cursor-pointer',
        active
          ? 'bg-white text-ink font-medium shadow-[0_1px_2px_rgba(16,24,40,0.06)] ring-1 ring-line'
          : 'text-ink-2 hover:bg-black/[0.035] hover:text-ink'
      )}
    >
      <span className={active ? 'text-accent' : 'text-muted'}>{icon}</span>
      <span className="flex-1 text-left truncate">{label}</span>
      {meta && <span className="text-[11.5px] text-muted tabular-nums">{meta}</span>}
    </button>
  );
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ activeView, myWorkFilter, onSelectView, assetCount, skillCount, activeRewardName, activePlaygroundName, compact }) => {
  const ic = 'w-4 h-4';
  if (compact) {
    const items: [React.ReactNode, string, boolean, () => void][] = [
      [<Library className={ic} />, 'Skill Library', activeView === 'skill_library' || activeView === 'skill_detail', () => onSelectView('skill_library', 'all')],
      [<Boxes className={ic} />, 'Components', activeView === 'component_library', () => onSelectView('component_library', 'all')],
      [<Sliders className={ic} />, 'Playground', activeView === 'playground', () => onSelectView('playground', 'all')],
      [<Users className={ic} />, 'Community', activeView === 'community', () => onSelectView('community', 'all')],
    ];
    const work: [React.ReactNode, string, boolean, () => void][] = [
      [<FileCode2 className={ic} />, 'My Skills', false, () => onSelectView('skill_library', 'my_skills')],
      [<Clock className={ic} />, 'Recent Projects', false, () => onSelectView('skill_detail', 'recent_projects')],
      [<FilePen className={ic} />, 'Drafts', false, () => onSelectView('playground', 'drafts')],
      [<Images className={ic} />, 'Imported Assets', activeView === 'asset_library', () => onSelectView('asset_library', 'imported_assets')],
    ];
    const Rail = ({ list }: { list: typeof items }) => (
      <>
        {list.map(([icon, label, on, fn]) => (
          <button key={label} type="button" title={label} onClick={fn} className={cx('w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer', on ? 'bg-white text-accent shadow-[0_1px_2px_rgba(16,24,40,0.08)] ring-1 ring-line' : 'text-muted hover:text-ink hover:bg-black/[0.04]')}>
            {icon}
          </button>
        ))}
      </>
    );
    return (
      <aside className="w-[56px] shrink-0 bg-[#fafafb] border-r border-line flex flex-col items-center">
        <div className="h-12 w-full flex items-center justify-center border-b border-line">
          <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center" title="Chaos Engine Labs">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 21 7v10l-9 5-9-5V7z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" fill="#5b8cff" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 py-3 flex-1">
          <Rail list={items} />
          <span className="w-6 h-px bg-line my-2" />
          <Rail list={work} />
        </div>
        <div className="pb-3">
          <Avatar name="Elena Vance" size={28} />
        </div>
      </aside>
    );
  }
  return (
    <aside className="w-[232px] shrink-0 bg-[#fafafb] border-r border-line flex flex-col">
      <div className="h-12 px-4 flex items-center gap-2.5 border-b border-line">
        <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 21 7v10l-9 5-9-5V7z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" fill="#5b8cff" />
          </svg>
        </div>
        <div className="leading-tight">
          <div className="text-[13.5px] font-semibold tracking-tight">Chaos Engine</div>
          <div className="text-[11px] text-muted">Labs</div>
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        <button type="button" className="w-full h-9 px-2.5 mb-4 rounded-lg border border-line bg-white flex items-center gap-2.5 text-[13px] hover:border-line-2 cursor-pointer">
          <span className="w-5 h-5 rounded-md bg-gradient-to-br from-[#2f6bff] to-[#6941c6] text-white text-[10px] font-semibold flex items-center justify-center">C</span>
          <span className="flex-1 text-left font-medium truncate">Core Skills</span>
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted" />
        </button>

        <div className="space-y-0.5">
          <NavItem icon={<Library className={ic} />} label="Skill Library" meta={`${skillCount}`} active={(activeView === 'skill_library' && myWorkFilter === 'all') || activeView === 'skill_detail'} onClick={() => onSelectView('skill_library', 'all')} />
          <NavItem icon={<Boxes className={ic} />} label="Components" active={activeView === 'component_library'} onClick={() => onSelectView('component_library', 'all')} />
      <NavItem icon={<Sliders className={ic} />} label="Playground" active={activeView === 'playground'} onClick={() => onSelectView('playground', 'all')} />
          <NavItem icon={<Users className={ic} />} label="Community" active={activeView === 'community'} onClick={() => onSelectView('community', 'all')} />
        </div>

        <div className="mt-6 mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">My work</div>
        <div className="space-y-0.5">
          <NavItem icon={<FileCode2 className={ic} />} label="My Skills" meta="2" active={activeView === 'skill_library' && myWorkFilter === 'my_skills'} onClick={() => onSelectView('skill_library', 'my_skills')} />
          <NavItem icon={<Clock className={ic} />} label="Recent Projects" onClick={() => onSelectView('skill_detail', 'recent_projects')} />
          <NavItem icon={<FilePen className={ic} />} label="Drafts" meta="1" onClick={() => onSelectView('playground', 'drafts')} />
          <NavItem icon={<Images className={ic} />} label="Imported Assets" meta={`${assetCount}`} active={activeView === 'asset_library'} onClick={() => onSelectView('asset_library', 'imported_assets')} />
        </div>
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={() => onSelectView('playground', 'drafts')}
          className="w-full text-left rounded-xl p-3 bg-night text-white relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-accent/30 blur-2xl" />
          <div className="relative text-[11px] text-white/50">Continue editing</div>
          <div className="relative text-[13.5px] font-semibold mt-0.5 truncate">{activePlaygroundName}</div>
          <div className="relative flex items-center justify-between mt-2">
            <span className="text-[11.5px] text-white/50 truncate">{activeRewardName ? `${activeRewardName} · v1.1.1` : 'Empty workspace'}</span>
            <span className="w-6 h-6 rounded-full bg-white text-night flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-3 h-3 fill-current" />
            </span>
          </div>
        </button>
        <div className="flex items-center gap-2.5 mt-3 px-1">
          <Avatar name="Elena Vance" size={26} />
          <div className="leading-tight min-w-0">
            <div className="text-[12.5px] font-medium truncate">Elena Vance</div>
            <div className="text-[11px] text-muted truncate">Technical Artist</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
