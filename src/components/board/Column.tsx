import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Application, Stage } from '../../types';
import { Card } from './Card';

interface ColumnProps {
  stage: Stage;
  applications: Application[];
  isFirst: boolean;
  isLast: boolean;
  canDelete: boolean;
  onAddCard: (stageId: string) => void;
  onEditCard: (application: Application) => void;
  onRename: (stageId: string, name: string) => void;
  onDelete: (stageId: string) => void;
  onMoveLeft: (stageId: string) => void;
  onMoveRight: (stageId: string) => void;
}

export function Column({
  stage,
  applications,
  isFirst,
  isLast,
  canDelete,
  onAddCard,
  onEditCard,
  onRename,
  onDelete,
  onMoveLeft,
  onMoveRight,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(stage.name);

  const commitRename = () => {
    onRename(stage.id, draftName);
    setRenaming(false);
  };

  const menuAction = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-200/60">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: stage.color }}
        />
        {renaming ? (
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setDraftName(stage.name);
                setRenaming(false);
              }
            }}
            className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-sm font-semibold"
          />
        ) : (
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
            {stage.name}
          </h3>
        )}
        <span className="rounded-full bg-slate-300/70 px-1.5 text-xs font-medium text-slate-600">
          {applications.length}
        </span>

        {/* Kebab menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={`${stage.name} column options`}
            className="rounded p-1 text-slate-400 hover:bg-slate-300/60 hover:text-slate-600"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg">
                <MenuItem onClick={menuAction(() => setRenaming(true))}>
                  Rename
                </MenuItem>
                <MenuItem
                  disabled={isFirst}
                  onClick={menuAction(() => onMoveLeft(stage.id))}
                >
                  Move left
                </MenuItem>
                <MenuItem
                  disabled={isLast}
                  onClick={menuAction(() => onMoveRight(stage.id))}
                >
                  Move right
                </MenuItem>
                <MenuItem
                  disabled={!canDelete}
                  danger
                  onClick={menuAction(() => onDelete(stage.id))}
                >
                  Delete
                </MenuItem>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 rounded-lg px-2 pb-2 transition-colors ${
          isOver ? 'bg-brand-100/50' : ''
        }`}
      >
        <SortableContext
          items={applications.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {applications.map((app) => (
            <Card
              key={app.id}
              application={app}
              onClick={() => onEditCard(app)}
            />
          ))}
        </SortableContext>

        {applications.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-slate-400">
            No applications
          </p>
        )}

        <button
          onClick={() => onAddCard(stage.id)}
          className="mt-1 rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-500 hover:bg-slate-300/50 hover:text-slate-700"
        >
          + Add application
        </button>
      </div>
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  disabled = false,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`block w-full px-3 py-1.5 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${
        danger ? 'text-red-600' : 'text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}
