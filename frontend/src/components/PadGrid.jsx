import { cn } from '@/lib/utils';

const PAD_COLORS = {
  empty: { bg: 'bg-slate-800', glow: '', border: 'border-slate-700' },
  blue: { bg: 'bg-blue-600', glow: 'shadow-[0_0_12px_rgba(59,130,246,0.5)]', border: 'border-blue-500' },
  green: { bg: 'bg-emerald-600', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]', border: 'border-emerald-500' },
  red: { bg: 'bg-red-600', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.5)]', border: 'border-red-500' },
  amber: { bg: 'bg-amber-500', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]', border: 'border-amber-400' },
  purple: { bg: 'bg-purple-600', glow: 'shadow-[0_0_12px_rgba(147,51,234,0.5)]', border: 'border-purple-500' },
  cyan: { bg: 'bg-cyan-500', glow: 'shadow-[0_0_12px_rgba(6,182,212,0.5)]', border: 'border-cyan-400' },
  pink: { bg: 'bg-pink-500', glow: 'shadow-[0_0_12px_rgba(236,72,153,0.5)]', border: 'border-pink-400' },
};

function Pad({ label, color = 'empty', active = false, onClick }) {
  const colors = PAD_COLORS[color] || PAD_COLORS.empty;
  const isLit = color !== 'empty';

  return (
    <button
      onClick={onClick}
      className={cn(
        'aspect-square rounded-md border-2 transition-all duration-150',
        'flex items-center justify-center text-xs font-bold uppercase tracking-wider',
        'select-none cursor-pointer',
        colors.bg,
        colors.border,
        isLit && colors.glow,
        isLit
          ? 'text-white/90 hover:brightness-110 active:brightness-75 active:scale-95'
          : 'text-slate-500 hover:bg-slate-700 hover:border-slate-600 active:bg-slate-600 active:scale-95',
        active && 'ring-2 ring-white ring-offset-2 ring-offset-slate-900',
      )}
    >
      {label}
    </button>
  );
}

function PadGrid({ rows = 4, cols = 4, pads = [], onPadClick }) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const label = `${String.fromCharCode(65 + r)}${c + 1}`;
      const padData = pads.find((p) => p.position === label);
      grid.push(
        <Pad
          key={label}
          label={label}
          color={padData?.color || 'empty'}
          active={padData?.active || false}
          onClick={() => onPadClick?.(label, padData)}
        />
      );
    }
  }

  return (
    <div className="bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-800">
      {/* Column labels */}
      <div
        className="grid gap-2 sm:gap-3 mb-2"
        style={{ gridTemplateColumns: `2rem repeat(${cols}, 1fr)` }}
      >
        <div />
        {Array.from({ length: cols }, (_, i) => (
          <div key={i} className="text-center text-xs font-mono text-slate-500">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Grid with row labels */}
      <div
        className="grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `2rem repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: rows }, (_, r) => (
          <>
            <div key={`label-${r}`} className="flex items-center justify-center text-xs font-mono text-slate-500">
              {String.fromCharCode(65 + r)}
            </div>
            {grid.slice(r * cols, (r + 1) * cols)}
          </>
        ))}
      </div>
    </div>
  );
}

export { PadGrid, Pad, PAD_COLORS };
