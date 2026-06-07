import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Application } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { applicationsInStage } from '../../services/ordering';
import { Column } from './Column';
import { Card } from './Card';
import { AddColumn } from './AddColumn';

interface BoardProps {
  onAddCard: (stageId: string) => void;
  onEditCard: (application: Application) => void;
}

export function Board({ onAddCard, onEditCard }: BoardProps) {
  const applications = useAppStore((s) => s.applications);
  const stages = useAppStore((s) => s.stages);
  const moveApplication = useAppStore((s) => s.moveApplication);
  const renameStage = useAppStore((s) => s.renameStage);
  const setStageFollowUpDays = useAppStore((s) => s.setStageFollowUpDays);
  const deleteStage = useAppStore((s) => s.deleteStage);
  const moveStage = useAppStore((s) => s.moveStage);
  const addStage = useAppStore((s) => s.addStage);

  const [activeId, setActiveId] = useState<string | null>(null);

  const orderedStages = useMemo(
    () => [...stages].sort((a, b) => a.order - b.order),
    [stages],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeApp = activeId
    ? applications.find((a) => a.id === activeId)
    : undefined;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeCardId = active.id as string;
    const overId = over.id as string;
    if (activeCardId === overId) return;

    const stageIds = new Set(stages.map((s) => s.id));
    const overStageId = stageIds.has(overId)
      ? overId
      : applications.find((a) => a.id === overId)?.stageId;
    if (!overStageId) return;

    const remaining = applications.filter((a) => a.id !== activeCardId);
    const targetList = applicationsInStage(remaining, overStageId);
    const overIndex = targetList.findIndex((a) => a.id === overId);
    const toIndex = overIndex === -1 ? targetList.length : overIndex;

    moveApplication(activeCardId, overStageId, toIndex);
  };

  const moveLeft = (stageId: string) => {
    const i = orderedStages.findIndex((s) => s.id === stageId);
    if (i > 0) moveStage(stageId, orderedStages[i - 1].id);
  };
  const moveRight = (stageId: string) => {
    const i = orderedStages.findIndex((s) => s.id === stageId);
    if (i < orderedStages.length - 1) moveStage(stageId, orderedStages[i + 1].id);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {orderedStages.map((stage, index) => (
          <Column
            key={stage.id}
            stage={stage}
            applications={applicationsInStage(applications, stage.id)}
            isFirst={index === 0}
            isLast={index === orderedStages.length - 1}
            canDelete={orderedStages.length > 1}
            onAddCard={onAddCard}
            onEditCard={onEditCard}
            onRename={renameStage}
            onSetFollowUp={setStageFollowUpDays}
            onDelete={deleteStage}
            onMoveLeft={moveLeft}
            onMoveRight={moveRight}
          />
        ))}
        <AddColumn onAdd={addStage} />
      </div>

      <DragOverlay>
        {activeApp ? (
          <Card application={activeApp} onClick={() => {}} overlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
