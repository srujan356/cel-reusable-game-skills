import React, { useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'night' | 'danger';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
};

export function Button({ variant = 'secondary', size = 'md', icon, className, children, ...rest }: BtnProps) {
  const v = {
    primary:
      'bg-accent text-white hover:bg-[#2459e6] shadow-[0_1px_2px_rgba(47,107,255,0.35),inset_0_1px_0_rgba(255,255,255,0.18)]',
    secondary: 'bg-white text-ink border border-line-2 hover:bg-subtle shadow-[0_1px_1px_rgba(16,24,40,0.04)]',
    ghost: 'text-ink-2 hover:bg-subtle hover:text-ink',
    night: 'bg-white/[0.06] text-white/90 border border-white/10 hover:bg-white/[0.11]',
    danger: 'text-[#c4320a] hover:bg-[#fef3f2]',
  }[variant];
  const s = size === 'sm' ? 'h-7 px-2.5 text-[12px] gap-1.5' : 'h-8 px-3 text-[13px] gap-2';
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed',
        v,
        s,
        className
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({
  active,
  night,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; night?: boolean }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer disabled:opacity-40',
        night
          ? active
            ? 'bg-white/15 text-white'
            : 'text-white/60 hover:text-white hover:bg-white/10'
          : active
          ? 'bg-accent-soft text-accent'
          : 'text-muted hover:text-ink hover:bg-subtle',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'night';
const PILL: Record<Tone, string> = {
  neutral: 'bg-subtle text-ink-2',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-[#ecfdf3] text-[#067647]',
  warning: 'bg-[#fffaeb] text-[#b54708]',
  danger: 'bg-[#fef3f2] text-[#b42318]',
  night: 'bg-white/[0.08] text-white/70',
};
export function Pill({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1 h-5 px-1.5 rounded-md text-[11px] font-medium whitespace-nowrap', PILL[tone], className)}>
      {children}
    </span>
  );
}

const DOT: Record<string, string> = {
  success: 'bg-[#12b76a]',
  warning: 'bg-[#f79009]',
  danger: 'bg-[#f04438]',
  accent: 'bg-accent',
  neutral: 'bg-faint',
};
export function Dot({ tone = 'neutral', className }: { tone?: keyof typeof DOT | string; className?: string }) {
  return <span className={cx('inline-block w-1.5 h-1.5 rounded-full shrink-0', DOT[tone] || DOT.neutral, className)} />;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  night,
  className,
}: {
  options: { value: T; label: React.ReactNode; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  night?: boolean;
  className?: string;
}) {
  return (
    <div className={cx('flex p-0.5 rounded-lg', night ? 'bg-white/[0.06]' : 'bg-subtle', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cx(
              'flex-1 h-7 px-2.5 rounded-md text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap',
              night
                ? active
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:text-white/80'
                : active
                ? 'bg-white text-ink shadow-[0_1px_2px_rgba(16,24,40,0.08)]'
                : 'text-muted hover:text-ink-2'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export const inputCls =
  'h-8 w-full rounded-lg border border-line-2 bg-white px-2.5 text-[12.5px] text-ink outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/15';

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="block text-[11.5px] text-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export function NumberInput({
  value,
  onChange,
  unit,
  min,
  max,
  step,
  invalid,
}: {
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cx(inputCls, 'font-mono tabular-nums pr-9', invalid && 'border-[#f04438] focus:border-[#f04438] focus:ring-[#f04438]/15')}
      />
      {unit && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-faint pointer-events-none">{unit}</span>}
    </div>
  );
}

export function SelectInput({
  value,
  onChange,
  options,
  night,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean; group?: string }[];
  night?: boolean;
  className?: string;
}) {
  const groups = Array.from(new Set(options.map((o) => o.group || '')));
  return (
    <div className={cx('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          'appearance-none cursor-pointer pr-8',
          night
            ? 'h-7 w-full rounded-lg bg-white/[0.06] border border-white/10 text-white/85 text-[12px] px-2.5 outline-none focus:border-white/30'
            : inputCls
        )}
      >
        {groups.map((g) =>
          g ? (
            <optgroup key={g} label={g} className="bg-white text-[#111827]">
              {options
                .filter((o) => o.group === g)
                .map((o) => (
                  <option key={o.value} value={o.value} disabled={o.disabled} className="bg-white text-[#111827]">
                    {o.label}
                  </option>
                ))}
            </optgroup>
          ) : (
            options
              .filter((o) => !o.group)
              .map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled} className="bg-white text-[#111827]">
                  {o.label}
                </option>
              ))
          )
        )}
      </select>
      <ChevronDown className={cx('w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none', night ? 'text-white/50' : 'text-muted')} />
    </div>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11.5px] text-muted">{label}</span>
        <span className="text-[11.5px] font-mono tabular-nums text-ink">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ background: `linear-gradient(to right, #2f6bff ${pct}%, #e6e8ed ${pct}%)` }}
        className="w-full"
      />
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center justify-between w-full gap-3 cursor-pointer group">
      {label && <span className="text-[12.5px] text-ink-2 group-hover:text-ink">{label}</span>}
      <span className={cx('relative w-8 h-[18px] rounded-full transition-colors shrink-0', checked ? 'bg-accent' : 'bg-line-2')}>
        <span
          className={cx(
            'absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-[0_1px_2px_rgba(16,24,40,0.2)] transition-all',
            checked ? 'left-[16px]' : 'left-[2px]'
          )}
        />
      </span>
    </button>
  );
}

export function Section({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cx('px-4 py-4 border-b border-line', className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{title}</h4>
        {action}
      </div>
      {children}
    </div>
  );
}

const AVATAR_COLORS = ['#2f6bff', '#0e9384', '#c11574', '#b54708', '#6941c6', '#0e0f13'];
export function Avatar({ name, size = 22 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  const color = AVATAR_COLORS[name.length % AVATAR_COLORS.length];
  return (
    <span
      style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}
      className="inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0"
    >
      {initials}
    </span>
  );
}

export function Tabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cx('flex items-center gap-5 border-b border-line', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'relative h-10 text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap',
            value === o.value ? 'text-ink' : 'text-muted hover:text-ink-2'
          )}
        >
          {o.label}
          {value === o.value && <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-ink" />}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  width = 'max-w-3xl',
  children,
}: {
  open: boolean;
  onClose: () => void;
  width?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0a0c11]/45 backdrop-blur-[3px]" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={cx(
          'w-full bg-white rounded-2xl border border-line shadow-[0_24px_80px_-16px_rgba(10,12,17,0.4)] overflow-hidden flex flex-col max-h-[88vh] animate-rise',
          width
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-6 pt-5 pb-4 border-b border-line flex items-start justify-between gap-4 shrink-0">
      <div className="min-w-0">
        <h2 className="text-[16px] font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-[12.5px] text-muted mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {children}
        <IconButton onClick={onClose} aria-label="Close">
          <X className="w-4 h-4" />
        </IconButton>
      </div>
    </div>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex items-center gap-1.5">
            <span
              className={cx(
                'w-5 h-5 rounded-full text-[10.5px] font-semibold flex items-center justify-center',
                i < current ? 'bg-accent text-white' : i === current ? 'bg-ink text-white' : 'bg-subtle text-muted'
              )}
            >
              {i + 1}
            </span>
            <span className={cx('text-[12px] font-medium', i <= current ? 'text-ink' : 'text-muted')}>{s}</span>
          </div>
          {i < steps.length - 1 && <span className="w-5 h-px bg-line-2" />}
        </React.Fragment>
      ))}
    </div>
  );
}
