"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  SECTION_TYPES,
  isSectionValid,
  sectionSummary,
  sectionTypeLabel,
  type Section,
  type SectionType,
} from "@/lib/admin/landing-sections";
import { ar } from "@/lib/admin/i18n-ar";

const selectCls = "px-3 py-2 border border-black/15 rounded-lg text-sm";
const iconBtnCls =
  "px-2 py-1 rounded border border-black/15 text-xs hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent";

// One draggable row. Keyboard users get dnd-kit's arrow-key sorting, and
// the ↑/↓ buttons below stay as a plain fallback for everyone else.
function SortableRow({
  section,
  index,
  total,
  isSelected,
  valid,
  summary,
  editor,
  onSelect,
  onRemove,
  onDuplicate,
  onMove,
  onToggleHidden,
}: {
  section: Section;
  index: number;
  total: number;
  isSelected: boolean;
  valid: boolean;
  summary: string;
  editor: React.ReactNode;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onToggleHidden: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-3 ${
        isDragging
          ? "relative z-10 border-black/40 bg-white shadow-lg"
          : isSelected
            ? "border-black/40 bg-gray-50"
            : "border-black/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          ref={setActivatorNodeRef}
          type="button"
          title={ar.landing.dragHandle}
          aria-label={ar.landing.dragHandle}
          style={{ touchAction: "none" }}
          className="shrink-0 px-1.5 py-1 rounded text-lg leading-none text-black/35 hover:text-black hover:bg-gray-100 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <span aria-hidden="true">⠿</span>
        </button>
        <button
          type="button"
          onClick={() => onSelect(section.id)}
          className="text-start flex-1"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-black/40">{index + 1}</span>
            <span className="text-sm font-medium">
              {sectionTypeLabel(section)}
            </span>
            {section.hidden && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
                {ar.landing.hiddenBadge}
              </span>
            )}
            {!valid && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                {ar.landing.incompleteBadge}
              </span>
            )}
          </div>
          {summary && (
            <div className="text-xs text-black/50 mt-1 truncate max-w-md">
              {summary}
            </div>
          )}
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            title={ar.landing.moveUp}
            aria-label={ar.landing.moveUp}
            disabled={index === 0}
            onClick={() => onMove(section.id, -1)}
            className={iconBtnCls}
          >
            ↑
          </button>
          <button
            type="button"
            title={ar.landing.moveDown}
            aria-label={ar.landing.moveDown}
            disabled={index === total - 1}
            onClick={() => onMove(section.id, 1)}
            className={iconBtnCls}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => onToggleHidden(section.id)}
            className={iconBtnCls}
          >
            {section.hidden
              ? ar.landing.showSection
              : ar.landing.hideSection}
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(section.id)}
            className={iconBtnCls}
          >
            {ar.landing.duplicateSection}
          </button>
          <button
            type="button"
            onClick={() => onRemove(section.id)}
            className={`${iconBtnCls} text-red-600`}
          >
            {ar.landing.deleteSection}
          </button>
        </div>
      </div>

      {isSelected && editor}
    </li>
  );
}

export function SectionsPanel({
  sections,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  onDuplicate,
  onMove,
  onReorder,
  onToggleHidden,
  renderEditor,
}: {
  sections: Section[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (type: SectionType) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onReorder: (activeId: string, overId: string) => void;
  onToggleHidden: (id: string) => void;
  renderEditor?: (section: Section) => React.ReactNode;
}) {
  const [newType, setNewType] = useState<SectionType>("hero");

  // Mouse drags start after a small move; touch drags need a short
  // long-press so the page can still be scrolled with a finger.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    onSelect(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  }

  return (
    <div className="bg-white border border-black/10 rounded-lg p-5 mb-4">
      <h2 className="font-bold mb-1">{ar.landing.sections}</h2>
      <p className="text-xs text-black/50 mb-3">{ar.landing.sectionsHelp}</p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          className={selectCls}
          value={newType}
          onChange={(e) => setNewType(e.target.value as SectionType)}
        >
          {SECTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {ar.landing.sectionTypes[type]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onAdd(newType)}
          className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/80"
        >
          {ar.landing.addSection}
        </button>
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-black/50 py-4 text-center">
          {ar.landing.noSections}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          accessibility={{
            screenReaderInstructions: {
              draggable: ar.landing.dragInstructions,
            },
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {sections.map((section, index) => {
                const valid = isSectionValid(section);
                const isSelected = section.id === selectedId;
                return (
                  <SortableRow
                    key={section.id}
                    section={section}
                    index={index}
                    total={sections.length}
                    isSelected={isSelected}
                    valid={valid}
                    summary={sectionSummary(section)}
                    editor={
                      isSelected && renderEditor ? (
                        <div className="mt-3 pt-3 border-t border-black/10">
                          <h3 className="text-sm font-medium mb-3">
                            {ar.landing.sectionSettings}
                          </h3>
                          {!valid && (
                            <p className="text-sm text-red-600 mb-3">
                              {ar.landing.invalidSection}
                            </p>
                          )}
                          {renderEditor(section)}
                        </div>
                      ) : null
                    }
                    onSelect={onSelect}
                    onRemove={onRemove}
                    onDuplicate={onDuplicate}
                    onMove={onMove}
                    onToggleHidden={onToggleHidden}
                  />
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
