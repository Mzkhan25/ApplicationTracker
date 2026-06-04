import { useState } from 'react';

/** Trailing affordance to add a new pipeline column. */
export function AddColumn({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed) onAdd(trimmed);
    setName('');
    setAdding(false);
  };

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex h-10 w-56 shrink-0 items-center gap-1 rounded-xl border border-dashed border-slate-300 px-3 text-sm font-medium text-slate-500 hover:border-slate-400 hover:bg-slate-200/40"
      >
        + Add column
      </button>
    );
  }

  return (
    <div className="w-56 shrink-0 rounded-xl bg-slate-200/60 p-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={submit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') {
            setName('');
            setAdding(false);
          }
        }}
        placeholder="Column name"
        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-semibold focus:border-brand-500 focus:outline-none"
      />
    </div>
  );
}
