import { useState, type FormEvent, type ReactNode } from 'react';
import type { Application, Priority, Stage, WorkMode } from '../../types';
import type { ApplicationInput } from '../../store/useAppStore';
import { Button } from '../common/Button';

/** A labelled form control. Nesting the control inside the label associates
 *  them for both accessibility and testing without manual id wiring. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

interface ApplicationFormProps {
  stages: Stage[];
  /** Stage to preselect when adding (ignored when editing). */
  defaultStageId?: string;
  initial?: Application;
  onSubmit: (input: ApplicationInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';
const labelClass = 'block text-xs font-medium text-slate-600 mb-1';

const todayISO = (): string => new Date().toISOString().slice(0, 10);
const numOrUndef = (v: string): number | undefined =>
  v.trim() === '' ? undefined : Number(v);
const trimOrUndef = (v: string): string | undefined =>
  v.trim() === '' ? undefined : v.trim();

export function ApplicationForm({
  stages,
  defaultStageId,
  initial,
  onSubmit,
  onCancel,
  onDelete,
}: ApplicationFormProps) {
  const [company, setCompany] = useState(initial?.company ?? '');
  const [role, setRole] = useState(initial?.role ?? '');
  const [stageId, setStageId] = useState(
    initial?.stageId ?? defaultStageId ?? stages[0]?.id ?? '',
  );
  const [appliedDate, setAppliedDate] = useState(
    initial?.appliedDate ?? todayISO(),
  );
  const [priority, setPriority] = useState<Priority>(
    initial?.priority ?? 'medium',
  );
  const [workMode, setWorkMode] = useState<WorkMode | ''>(
    initial?.workMode ?? '',
  );
  const [location, setLocation] = useState(initial?.location ?? '');
  const [jobUrl, setJobUrl] = useState(initial?.jobUrl ?? '');
  const [salaryMin, setSalaryMin] = useState(
    initial?.salaryMin?.toString() ?? '',
  );
  const [salaryMax, setSalaryMax] = useState(
    initial?.salaryMax?.toString() ?? '',
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    onSubmit({
      company: company.trim(),
      role: role.trim(),
      stageId,
      appliedDate,
      priority,
      workMode: workMode === '' ? undefined : workMode,
      location: trimOrUndef(location),
      jobUrl: trimOrUndef(jobUrl),
      salaryMin: numOrUndef(salaryMin),
      salaryMax: numOrUndef(salaryMax),
      notes: trimOrUndef(notes),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company *">
          <input
            className={inputClass}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            autoFocus
            required
          />
        </Field>
        <Field label="Role *">
          <input
            className={inputClass}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Stage">
          <select
            className={inputClass}
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Applied date">
          <input
            type="date"
            className={inputClass}
            value={appliedDate}
            onChange={(e) => setAppliedDate(e.target.value)}
          />
        </Field>
        <Field label="Priority">
          <select
            className={inputClass}
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Work mode">
          <select
            className={inputClass}
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value as WorkMode | '')}
          >
            <option value="">—</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
        </Field>
        <Field label="Location">
          <input
            className={inputClass}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State"
          />
        </Field>
      </div>

      <Field label="Job posting URL">
        <input
          type="url"
          className={inputClass}
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          placeholder="https://…"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Salary min">
          <input
            type="number"
            className={inputClass}
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            placeholder="120000"
          />
        </Field>
        <Field label="Salary max">
          <input
            type="number"
            className={inputClass}
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            placeholder="150000"
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          className={inputClass}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Interview details, contacts, follow-ups…"
        />
      </Field>

      <div className="flex items-center justify-between pt-1">
        {onDelete ? (
          <Button type="button" variant="danger" size="sm" onClick={onDelete}>
            Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{initial ? 'Save' : 'Add application'}</Button>
        </div>
      </div>
    </form>
  );
}
