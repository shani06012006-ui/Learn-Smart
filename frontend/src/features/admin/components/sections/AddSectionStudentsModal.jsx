import { useMemo, useState } from "react";
import { Loader2, Search, UserPlus, Users, AlertTriangle } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import {
  useGetSectionStudentsQuery,
  useAssignSectionStudentsMutation,
} from "../../../../store/api/realApi";
import { extractErrorMessage } from "../../../../utils/apiError";

export default function AddSectionStudentsModal({
  open,
  onClose,
  section,
  onAdded,
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [error, setError] = useState("");

  const { data, isLoading, isError, error: qError, refetch } =
    useGetSectionStudentsQuery(section?.id, { skip: !open || !section?.id });

  const [apply, { isLoading: saving }] = useAssignSectionStudentsMutation();

  const candidates = data?.candidates ?? [];
  const assignedCount = data?.assigned?.length ?? 0;
  const capacity = section?.capacity ?? 40;
  const remaining = Math.max(0, capacity - assignedCount);

  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (s) =>
        (s.full_name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q)
    );
  }, [candidates, search]);

  // Reset when opening
  useMemo(() => {
    if (open) {
      setSearch("");
      setSelected(new Set());
      setError("");
    }
  }, [open, section?.id]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Guard: don't exceed remaining capacity
        if (next.size >= remaining) return prev;
        next.add(id);
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const s of filteredCandidates) {
        if (next.size >= remaining) break;
        next.add(s.enrollment_id);
      }
      return next;
    });
  };

  const clearAll = () => setSelected(new Set());

  async function handleSave() {
    if (selected.size === 0) {
      setError("Select at least one student.");
      return;
    }
    setError("");
    try {
      await apply({
        id: section.id,
        assign: Array.from(selected),
        unassign: [],
      }).unwrap();
      refetch();
      onAdded?.();
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  }

  const capacityFull = remaining === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Students to Section"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || selected.size === 0 || capacityFull}
            loading={saving}
          >
            <UserPlus size={14} />
            Add Selected ({selected.size}) Student{selected.size === 1 ? "" : "s"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Capacity info */}
        <div
          className={
            "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs " +
            (capacityFull
              ? "border-coral-200 bg-coral-50 text-coral-700"
              : "border-slate-200 bg-slate-50 text-slate-600")
          }
        >
          <div className="flex items-center gap-2">
            <Users size={14} />
            <span className="font-bold uppercase tracking-wider">
              Section Capacity
            </span>
            <span className="rounded-md bg-white px-2 py-0.5 font-extrabold ring-1 ring-slate-200">
              {assignedCount} / {capacity}
            </span>
          </div>
          {capacityFull ? (
            <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wider">
              <AlertTriangle size={11} />
              Full
            </span>
          ) : (
            <span className="font-semibold">{remaining} slots available</span>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-semibold text-coral-700">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search available students…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-purple-400"
          />
        </div>

        {/* Select-all controls */}
        {!capacityFull && filteredCandidates.length > 0 && (
          <div className="flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={selectAllVisible}
              className="font-bold text-purple-600 hover:text-purple-700"
            >
              Select all visible
            </button>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="font-bold text-slate-500 hover:text-slate-700"
              >
                Clear selection
              </button>
            )}
          </div>
        )}

        {/* Candidate list */}
        <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-200">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin text-slate-300" />
            </div>
          ) : isError ? (
            <p className="p-6 text-center text-xs text-coral-600">
              {extractErrorMessage(qError)}
            </p>
          ) : filteredCandidates.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400">
              No available students in this grade.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredCandidates.map((s) => {
                const checked = selected.has(s.enrollment_id);
                const disabled = capacityFull && !checked;
                return (
                  <li key={s.enrollment_id}>
                    <label
                      className={
                        "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition " +
                        (checked
                          ? "bg-purple-50"
                          : disabled
                          ? "cursor-not-allowed bg-slate-50 opacity-60"
                          : "hover:bg-slate-50")
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(s.enrollment_id)}
                        className="h-4 w-4 rounded border-slate-300 text-purple-500 focus:ring-purple-300"
                      />
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[11px] font-bold text-purple-700">
                        {(s.full_name || s.email || "?")
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy-950">
                          {s.full_name}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {s.email}
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}