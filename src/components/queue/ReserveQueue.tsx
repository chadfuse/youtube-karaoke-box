import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKaraoke } from "@/state/karaokeStore";
import { GripVertical, X } from "lucide-react";

function Row({ id, index, title, reserver, thumbnail, onRemove }: { id: string; index: number; title: string; reserver?: string; thumbnail: string; onRemove: () => void; }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 border rounded-md bg-card">
      <button aria-label="Drag handle" className="cursor-grab touch-none p-1 rounded border bg-muted" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <img src={thumbnail} alt={`${title} thumbnail`} className="h-12 w-20 object-cover rounded" loading="lazy" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" title={title}>{index + 1}. {title}</div>
        <div className="text-xs text-muted-foreground truncate">{reserver ? `Reserved by ${reserver}` : "Unreserved"}</div>
      </div>
      <Button size="sm" variant="secondary" onClick={onRemove} aria-label="Remove from queue"><X className="h-4 w-4" /></Button>
    </div>
  );
}

export default function ReserveQueue() {
  const { queue, removeFromQueue, moveInQueue } = useKaraoke();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = queue.findIndex((i) => i.id === active.id);
    const newIndex = queue.findIndex((i) => i.id === over.id);
    moveInQueue(oldIndex, newIndex);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reserve Queue</CardTitle>
      </CardHeader>
      <CardContent>
        {queue.length === 0 ? (
          <p className="text-sm text-muted-foreground">No songs reserved yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={queue.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {queue.map((s, idx) => (
                  <Row key={s.id} id={s.id} index={idx} title={s.title} reserver={s.reserver} thumbnail={s.thumbnailUrl} onRemove={() => removeFromQueue(s.id)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
