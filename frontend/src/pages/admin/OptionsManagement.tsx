import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";
import { api } from "@/api/client";
import {
  Plus,
  X,
  Edit,
  Trash2,
  Layers,
  GripVertical,
  Check,
} from "lucide-react";

interface SelectionOption {
  id: string;
  category: string;
  label: string;
  value: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type GroupedOptions = Record<string, SelectionOption[]>;

const CATEGORY_LABELS: Record<string, string> = {
  hearUsFrom: "How Did You Hear About Us?",
  branch: "Branches",
};

const CATEGORY_ICONS: Record<string, string> = {
  hearUsFrom: "bg-blue-50 text-blue-600",
  branch: "bg-emerald-50 text-emerald-600",
};

// ── Add Option Modal ──────────────────────────────────────────

function AddOptionModal({
  category,
  onClose,
  onSuccess,
}: {
  category: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post("/selection-options", {
        category,
        label: label.trim(),
        value: value.trim() || undefined,
        sortOrder: 0,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to create option");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Add Option to "{CATEGORY_LABELS[category] || category}"
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
              {error}
            </div>
          )}
          <Input
            label="Display Label *"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Google Search, Main Branch"
            required
          />
          <Input
            label="Stored Value (optional)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Leave blank to use label as value"
          />
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} icon={<Plus className="w-4 h-4" />}>
              Add Option
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Option Modal ─────────────────────────────────────────

function EditOptionModal({
  option,
  onClose,
  onSuccess,
}: {
  option: SelectionOption;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [label, setLabel] = useState(option.label);
  const [value, setValue] = useState(option.value || "");
  const [sortOrder, setSortOrder] = useState(option.sortOrder);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.put(`/selection-options/${option.id}`, {
        label: label.trim(),
        value: value.trim() || null,
        sortOrder,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update option");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Option</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
              {error}
            </div>
          )}
          <Input
            label="Display Label *"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
          <Input
            label="Stored Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Leave blank to use label as value"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────

function DeleteOptionDialog({
  option,
  onClose,
  onConfirm,
  loading,
}: {
  option: SelectionOption;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Delete Option</h3>
          <p className="mt-2 text-sm text-gray-500">
            Are you sure you want to delete <strong>"{option.label}"</strong>?
            This will remove it from all forms.
          </p>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={loading}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Draggable Option Row ───────────────────────────────────────

function DraggableOptionRow({
  option,
  index,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDrop,
  isDragging,
  isDragOver,
}: {
  option: SelectionOption;
  index: number;
  onEdit: (opt: SelectionOption) => void;
  onDelete: (opt: SelectionOption) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (index: number) => void;
  onDrop: (index: number) => void;
  isDragging: boolean;
  isDragOver: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart(index);
      }}
      onDragOver={onDragOver}
      onDragEnter={() => onDragEnter(index)}
      onDrop={() => onDrop(index)}
      className={`
        flex items-center justify-between p-3 rounded-lg border
        transition-all duration-150 cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-30 ring-2 ring-primary-400 shadow-md" : ""}
        ${isDragOver ? "border-primary-400 bg-primary-50/50 shadow-sm" : ""}
        ${option.isActive ? "bg-white border-gray-100" : "bg-gray-50 border-gray-100 opacity-60"}
        hover:border-gray-300 hover:shadow-sm
      `}
    >
      <div className="flex items-center gap-3">
        <div className="text-gray-300 hover:text-gray-500 transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono w-5 tabular-nums">
              {index + 1}.
            </span>
            <p className="text-sm font-medium text-gray-900">{option.label}</p>
            {option.value && option.value !== option.label && (
              <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {option.value}
              </code>
            )}
          </div>
          {!option.isActive && (
            <Badge variant="danger" size="sm">Inactive</Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(option)}
          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors cursor-pointer"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(option)}
          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Category Section ──────────────────────────────────────────

function CategorySection({
  category,
  options,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
  reordering,
}: {
  category: string;
  options: SelectionOption[];
  onAdd: () => void;
  onEdit: (opt: SelectionOption) => void;
  onDelete: (opt: SelectionOption) => void;
  onReorder: (items: { id: string; sortOrder: number }[]) => Promise<void>;
  reordering: boolean;
}) {
  const [localItems, setLocalItems] = useState(options);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Sync local items when prop changes (e.g., after adding/editing/deleting)
  useEffect(() => {
    setLocalItems(options);
  }, [options]);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDrop = async (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Optimistic local reorder
    const reordered = [...localItems];
    const [movedItem] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, movedItem);

    // Assign new sort orders based on position
    const updatedItems = reordered.map((item, idx) => ({
      id: item.id,
      sortOrder: idx,
    }));

    // Optimistically update local state
    setLocalItems(reordered);
    setDragIndex(null);
    setDragOverIndex(null);

    // Persist to server
    try {
      await onReorder(updatedItems);
    } catch {
      // Rollback on failure — restore original order
      setLocalItems(options);
    } finally {
      setDragOverIndex(null);
    }
  };

  return (
    <Card key={category}>
      <CardHeader
        title={CATEGORY_LABELS[category] || category}
        subtitle={`${options.length} option${options.length !== 1 ? "s" : ""}`}
        action={
          <div className="flex items-center gap-2">
            {reordering && (
              <span className="text-xs text-gray-400 animate-pulse">Saving order...</span>
            )}
            <Button size="sm" onClick={onAdd} icon={<Plus className="w-4 h-4" />}>
              Add
            </Button>
          </div>
        }
      />
      <div className="space-y-2">
        {localItems.map((opt, idx) => (
          <DraggableOptionRow
            key={opt.id}
            option={opt}
            index={idx}
            onEdit={onEdit}
            onDelete={onDelete}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDrop={handleDrop}
            isDragging={dragIndex === idx}
            isDragOver={dragOverIndex === idx}
          />
        ))}
      </div>
      {localItems.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-400">
          No options in this category yet.
        </div>
      )}
    </Card>
  );
}

// ── Options Management Page ──────────────────────────────────

export function OptionsManagement() {
  const [grouped, setGrouped] = useState<GroupedOptions>({});
  const [loading, setLoading] = useState(true);
  const [addCategory, setAddCategory] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<SelectionOption | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SelectionOption | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: GroupedOptions }>("/selection-options/grouped");
      setGrouped(res.data || {});
    } catch (err) {
      console.error("Failed to load options:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/selection-options/${deleteTarget.id}`);
      await loadData();
    } catch (err) {
      console.error("Failed to delete option:", err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      // Create a placeholder option to seed the new category
      await api.post("/selection-options", {
        category: newCategoryName.trim().toLowerCase().replace(/\s+/g, "_"),
        label: "New option...",
        sortOrder: 0,
      });
      setNewCategoryName("");
      setShowNewCategory(false);
      await loadData();
    } catch (err) {
      console.error("Failed to create category:", err);
    }
  };

  if (loading) return <PageLoader />;

  const categories = Object.keys(grouped);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Options & Lists</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage drop-down options used across the system (referral sources, branches, etc.)
          </p>
        </div>
        <Button
          onClick={() => setShowNewCategory(true)}
          variant="outline"
          icon={<Layers className="w-4 h-4" />}
        >
          New Category
        </Button>
      </div>

      {/* New Category */}
      {showNewCategory && (
        <Card>
          <div className="flex items-center gap-3">
            <Input
              label="New Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Insurance Provider, Test Type"
            />
            <div className="flex gap-2 pt-5">
              <Button
                size="sm"
                onClick={handleCreateCategory}
                icon={<Check className="w-4 h-4" />}
              >
                Create
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowNewCategory(false);
                  setNewCategoryName("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {categories.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            No option categories defined yet. Create your first category and add options.
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <CategorySection
              key={category}
              category={category}
              options={grouped[category]}
              onAdd={() => setAddCategory(category)}
              onEdit={(opt) => setEditTarget(opt)}
              onDelete={(opt) => setDeleteTarget(opt)}
              onReorder={async (items) => {
                setReordering(true);
                try {
                  await api.put("/selection-options/reorder/batch", { items });
                  // Reload to get server-confirmed order
                  const res = await api.get<{ success: boolean; data: GroupedOptions }>("/selection-options/grouped");
                  setGrouped(res.data || {});
                } finally {
                  setReordering(false);
                }
              }}
              reordering={reordering}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {addCategory && (
        <AddOptionModal
          category={addCategory}
          onClose={() => setAddCategory(null)}
          onSuccess={loadData}
        />
      )}
      {editTarget && (
        <EditOptionModal
          option={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={loadData}
        />
      )}
      {deleteTarget && (
        <DeleteOptionDialog
          option={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  );
}
