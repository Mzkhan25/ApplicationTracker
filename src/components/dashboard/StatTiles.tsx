interface Tile {
  label: string;
  value: string;
  hint?: string;
}

function Tile({ label, value, hint }: Tile) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

interface StatTilesProps {
  total: number;
  responseRate: number;
  companyCount: number;
  followUpCount: number;
}

export function StatTiles({
  total,
  responseRate,
  companyCount,
  followUpCount,
}: StatTilesProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Tile label="Applications" value={String(total)} />
      <Tile
        label="Response rate"
        value={`${Math.round(responseRate * 100)}%`}
        hint="moved past first stage"
      />
      <Tile label="Companies" value={String(companyCount)} />
      <Tile
        label="Follow-ups due"
        value={String(followUpCount)}
        hint="past stage reminder window"
      />
    </div>
  );
}
