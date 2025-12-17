import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Discipline {
  id: string;
  name: string;
  category: string;
  color: string;
}

export function Disciplines() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [focusedDisciplineId, setFocusedDisciplineId] = useState<string | null>(
    null
  );
  const [editingItem, setEditingItem] = useState<Discipline | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("disciplines")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to load disciplines");
      return;
    }

    setDisciplines(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function safeDelete(item: Discipline) {
    const { count, error } = await supabase
      .from("classes")
      .select("*", { count: "exact", head: true })
      .eq("discipline_id", item.id);

    if (error) {
      toast.error("Unable to validate discipline usage");
      return;
    }

    if ((count ?? 0) > 0) {
      toast.error("This discipline has classes assigned and cannot be deleted");
      return;
    }

    const { error: delError } = await supabase
      .from("disciplines")
      .delete()
      .eq("id", item.id);

    if (delError) {
      toast.error("Delete failed");
      return;
    }

    toast.success("Discipline deleted");
    load();
  }

  async function save(item: Discipline) {
    const { error } = await supabase
      .from("disciplines")
      .update({
        name: item.name,
        category: item.category,
        color: item.color,
      })
      .eq("id", item.id);

    if (error) {
      toast.error("Save failed");
      return;
    }

    toast.success("Discipline updated");
    setEditingItem(null);
    load();
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading disciplines…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1 space-y-2">
        {disciplines.map((d) => (
          <div
            key={d.id}
            onClick={() => setFocusedDisciplineId(d.id)}
            className={`p-3 rounded border cursor-pointer ${
              focusedDisciplineId === d.id ? "bg-muted" : ""
            }`}
          >
            {d.name}
          </div>
        ))}
      </div>

      <div className="col-span-2">
        {focusedDisciplineId && (
          <>
            {editingItem ? (
              <div className="space-y-4">
                <Input
                  value={editingItem.name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                />
                <Input
                  value={editingItem.category}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      category: e.target.value,
                    })
                  }
                />
                <Input
                  value={editingItem.color}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, color: e.target.value })
                  }
                />
                <div className="flex gap-2">
                  <Button onClick={() => save(editingItem)}>Save</Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingItem(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {(() => {
                  const item = disciplines.find(
                    (d) => d.id === focusedDisciplineId
                  );
                  if (!item) return null;

                  return (
                    <div className="space-y-4">
                      <div>
                        <strong>Name:</strong> {item.name}
                      </div>
                      <div>
                        <strong>Category:</strong> {item.category || "Other"}
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => setEditingItem(item)}>
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => safeDelete(item)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
