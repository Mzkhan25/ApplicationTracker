import { useState } from 'react';
import type { Application } from '../types';
import { useAppStore, type ApplicationInput } from '../store/useAppStore';
import { Board } from '../components/board/Board';
import { ApplicationForm } from '../components/board/ApplicationForm';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';

type Editing =
  | { mode: 'add'; stageId?: string }
  | { mode: 'edit'; application: Application }
  | null;

export default function BoardPage() {
  const stages = useAppStore((s) => s.stages);
  const addApplication = useAppStore((s) => s.addApplication);
  const updateApplication = useAppStore((s) => s.updateApplication);
  const deleteApplication = useAppStore((s) => s.deleteApplication);

  const [editing, setEditing] = useState<Editing>(null);

  const handleSubmit = (input: ApplicationInput) => {
    if (editing?.mode === 'edit') {
      updateApplication(editing.application.id, input);
    } else {
      addApplication(input);
    }
    setEditing(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Pipeline</h1>
          <p className="text-sm text-slate-500">
            Drag cards between columns to update their status.
          </p>
        </div>
        <Button onClick={() => setEditing({ mode: 'add' })}>
          + New application
        </Button>
      </div>

      <Board
        onAddCard={(stageId) => setEditing({ mode: 'add', stageId })}
        onEditCard={(application) => setEditing({ mode: 'edit', application })}
      />

      <Modal
        open={editing !== null}
        title={editing?.mode === 'edit' ? 'Edit application' : 'New application'}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <ApplicationForm
            stages={stages}
            defaultStageId={editing.mode === 'add' ? editing.stageId : undefined}
            initial={editing.mode === 'edit' ? editing.application : undefined}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
            onDelete={
              editing.mode === 'edit'
                ? () => {
                    deleteApplication(editing.application.id);
                    setEditing(null);
                  }
                : undefined
            }
          />
        )}
      </Modal>
    </div>
  );
}
