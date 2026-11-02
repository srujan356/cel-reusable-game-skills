import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, ChevronRight, Download, Route, Search, TriangleAlert, Upload } from 'lucide-react';
import { Avatar, Button, IconButton, cx } from './ui';

export type MainViewId = 'skill_library' | 'skill_detail' | 'feedback_learning' | 'playground' | 'asset_library' | 'component_library' | 'community';
export type MyWorkSubFilter = 'all' | 'my_skills' | 'recent_projects' | 'drafts' | 'imported_assets';

const FLOWS = [
  'Library → Detail → Playground',
  'Import & analyze an asset',
  'Replace Coins with Flowers',
  'Configure an action',
  'Edit connections',
  'Preview skip, error, complete',
  'Export a package',
];

interface TopBarProps {
  breadcrumbs: { label: string; onClick?: () => void }[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  showExport: boolean;
  onTour: (flowId: number) => void;
  validation: { valid: boolean; warningCount: number; message: string };
  saveStatus: string;
}

function useOutside(ref: React.RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, close]);
}

export const TopBar: React.FC<TopBarProps> = ({ breadcrumbs, searchQuery, onSearchChange, onOpenImport, onOpenExport, showExport, onTour, validation, saveStatus }) => {
  const [tourOpen, setTourOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const tourRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useOutside(tourRef, () => setTourOpen(false));
  useOutside(bellRef, () => setBellOpen(false));

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const vTone = !validation.valid ? 'danger' : validation.warningCount ? 'warning' : 'success';

  return (
    <header className="h-12 shrink-0 bg-white border-b border-line flex items-center gap-4 px-4 z-30">
      <nav className="flex items-center gap-1 min-w-0 flex-1 text-[13px]">
        {breadcrumbs.map((c, i) => {
          const last = i === breadcrumbs.length - 1;
          return (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-faint shrink-0" />}
              <button
                type="button"
                onClick={c.onClick}
                disabled={last || !c.onClick}
                className={cx('px-1.5 py-1 rounded-md truncate transition-colors', last ? 'text-ink font-medium' : 'text-muted hover:text-ink hover:bg-subtle cursor-pointer')}
              >
                {c.label}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      <div className="relative w-[300px] shrink-0">
        <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          ref={searchRef}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search skills, tags, assets"
          className="w-full h-8 pl-8.5 pr-12 rounded-lg bg-subtle border border-transparent text-[12.5px] outline-none placeholder:text-muted focus:bg-white focus:border-line-2 transition"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10.5px] font-sans text-muted px-1.5 h-5 inline-flex items-center rounded border border-line-2 bg-white">⌘K</kbd>
      </div>

      <div className="flex items-center gap-1.5 flex-1 justify-end">
        <div className="hidden lg:flex items-center gap-1.5 text-[12px] text-muted mr-1 max-w-[200px]" title={saveStatus}>
          <Check className="w-3.5 h-3.5 text-[#12b76a] shrink-0" />
          <span className="truncate">{saveStatus}</span>
        </div>

        <span
          title={validation.message}
          className={cx(
            'hidden md:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[12px] font-medium',
            vTone === 'success' && 'bg-[#ecfdf3] text-[#067647]',
            vTone === 'warning' && 'bg-[#fffaeb] text-[#b54708]',
            vTone === 'danger' && 'bg-[#fef3f2] text-[#b42318]'
          )}
        >
          {vTone === 'success' ? <Check className="w-3.5 h-3.5" /> : <TriangleAlert className="w-3.5 h-3.5" />}
          {vTone === 'success' ? 'Valid' : vTone === 'warning' ? `${validation.warningCount} warning` : 'Invalid'}
        </span>

        <div className="relative" ref={tourRef}>
          <Button variant="ghost" size="md" icon={<Route className="w-4 h-4" />} onClick={() => setTourOpen((o) => !o)}>
            Tour
          </Button>
          {tourOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-line shadow-[0_16px_40px_-12px_rgba(16,24,40,0.25)] p-1.5 animate-rise">
              <div className="px-2.5 pt-1.5 pb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">Prototype flows</div>
              {FLOWS.map((f, i) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    onTour(i + 1);
                    setTourOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left text-[13px] hover:bg-subtle cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-md bg-subtle text-[11px] font-semibold text-ink-2 flex items-center justify-center">{i + 1}</span>
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button variant="secondary" icon={<Upload className="w-3.5 h-3.5" />} onClick={onOpenImport}>
          Import
        </Button>
        {showExport && (
          <Button variant="primary" icon={<Download className="w-3.5 h-3.5" />} onClick={onOpenExport}>
            Export
          </Button>
        )}

        <div className="relative" ref={bellRef}>
          <IconButton onClick={() => setBellOpen((o) => !o)} aria-label="Notifications" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
          </IconButton>
          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-line shadow-[0_16px_40px_-12px_rgba(16,24,40,0.25)] p-1.5 animate-rise">
              {[
                ['Inspection finished', 'Royal_Chest_Rigged_v2.glb · 4 clips found'],
                ['New contribution', '@mchen_dev patched skip handling in v1.1.1'],
                ['Fork created', 'spring-blossom-reward-reveal by @sora_ux'],
              ].map(([t, d]) => (
                <div key={t} className="px-3 py-2.5 rounded-lg hover:bg-subtle">
                  <div className="text-[13px] font-medium">{t}</div>
                  <div className="text-[12px] text-muted mt-0.5">{d}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ml-1">
          <Avatar name="Elena Vance" size={28} />
        </div>
      </div>
    </header>
  );
};
