"use client";

import { useEffect, useRef, useState } from "react";
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

// Small line icon per section type so the list is scannable at a glance.
// Inline SVG (no icon dependency) with stroke following the current color.
function SectionTypeIcon({ type }: { type: SectionType }) {
  const paths: Record<SectionType, string> = {
    hero: "M3 5h18v14H3zM3 10h18",
    gallery: "M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6",
    features: "M4 6h16M4 12h16M4 18h10",
    size_guide: "M4 4h16v16H4zM4 9h16M9 4v16",
    before_after: "M12 3v18M3 7h6v10H3zM15 7h6v10h-6z",
    testimonials: "M4 5h16v10H8l-4 4z",
    faq: "M12 4a8 8 0 100 16 8 8 0 000-16zM12 9v.01M11 12h1v4h1",
    countdown: "M12 4a8 8 0 100 16 8 8 0 000-16zM12 4V2M10 2h4M12 8v4l3 2",
    rich_text: "M4 6h16M4 12h16M4 18h10",
    order_form: "M6 3h9l3 3v15H6zM9 8h6M9 12h6M9 16h4",
    sticky_cta: "M4 12h16M15 7l5 5-5 5",
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d={paths[type]} />
    </svg>
  );
}

// One draggable row. Keyboard users get dnd-kit's arrow-key sorting, and
// the ↑/↓ buttons below stay as a plain fallback for everyone else.
function SortableRow({
  section,
  index,
  total,
  isSelected,
  valid,
  summary,
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

  const label = sectionTypeLabel(section);
  // Skip the subtitle when it just repeats the type label.
  const showSummary =
    summary.trim() !== "" && summary.trim() !== label.trim();

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-2.5 ${
        isDragging
          ? "relative z-10 border-black/40 bg-white shadow-lg"
          : isSelected
            ? "border-black/40 bg-gray-50"
            : "border-black/10"
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          title={ar.landing.dragHandle}
          aria-label={ar.landing.dragHandle}
          style={{ touchAction: "none" }}
          className="shrink-0 px-1 py-1 rounded leading-none text-black/35 hover:text-black hover:bg-gray-100 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <span aria-hidden="true">⠿</span>
        </button>

        <button
          type="button"
          onClick={() => onSelect(section.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-start"
        >
          <span className="shrink-0 text-black/40">
            <SectionTypeIcon type={section.type} />
          </span>
          <span className="truncate text-sm font-medium">{label}</span>
          {section.hidden && (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
              {ar.landing.hiddenBadge}
            </span>
          )}
          {!valid && (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
              {ar.landing.incompleteBadge}
            </span>
          )}
        </button>

        <RowMenu
          hidden={section.hidden}
          canMoveUp={index !== 0}
          canMoveDown={index !== total - 1}
          onMoveUp={() => onMove(section.id, -1)}
          onMoveDown={() => onMove(section.id, 1)}
          onDuplicate={() => onDuplicate(section.id)}
          onToggleHidden={() => onToggleHidden(section.id)}
          onRemove={() => onRemove(section.id)}
        />
      </div>

      {showSummary && (
        <div className="mt-1 ps-6 text-xs text-black/50 truncate">
          {summary}
        </div>
      )}
    </li>
  );
}

// Per-card "⋯" menu holding the row actions so the card stays compact and
// nothing gets clipped. Closes on outside click, Escape or an action.
function RowMenu({
  hidden,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onToggleHidden,
  onRemove,
}: {
  hidden: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onToggleHidden: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  const itemCls =
    "w-full text-start px-3 py-2 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={ar.landing.sectionActions}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="px-2 py-1 rounded border border-black/15 text-sm leading-none hover:bg-gray-100"
      >
        ⋯
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 mt-1 z-40 w-44 rounded-xl border border-black/10 bg-white p-1 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            disabled={!canMoveUp}
            onClick={run(onMoveUp)}
            className={itemCls}
          >
            {ar.landing.moveUp}
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canMoveDown}
            onClick={run(onMoveDown)}
            className={itemCls}
          >
            {ar.landing.moveDown}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={run(onDuplicate)}
            className={itemCls}
          >
            {ar.landing.duplicateSection}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={run(onToggleHidden)}
            className={itemCls}
          >
            {hidden ? ar.landing.showSection : ar.landing.hideSection}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={run(onRemove)}
            className={`${itemCls} text-red-600`}
          >
            {ar.landing.deleteSection}
          </button>
        </div>
      )}
    </div>
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
