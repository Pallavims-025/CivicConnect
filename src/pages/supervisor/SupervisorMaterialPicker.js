import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

export function SupervisorMaterialPicker({ inventory, value, onChange, onSelect, id }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const materials = useMemo(() => (inventory || []).filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase())
  ), [inventory, query]);

  const chooseMaterial = (item) => {
    onSelect(item);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type="text"
          value={open ? query : value}
          onFocus={() => { setQuery(''); setOpen(true); }}
          onChange={(event) => { setQuery(event.target.value); onChange?.(event.target.value); setOpen(true); }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          placeholder="Search available materials"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-options`}
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs font-semibold focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          required
        />
      </div>
      {open && (
        <ul id={`${id}-options`} role="listbox" className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {materials.length ? materials.map((item) => (
            <li key={item.id} role="option" aria-selected={value === item.name}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseMaterial(item)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs hover:bg-amber-50"
              >
                <span className="font-semibold text-slate-800">{item.name}</span>
                <span className="shrink-0 text-[10px] text-slate-500">{item.availableQuantity} {item.unit} available</span>
              </button>
            </li>
          )) : <li className="px-3 py-3 text-xs text-slate-500">No matching inventory materials.</li>}
        </ul>
      )}
    </div>
  );
}
