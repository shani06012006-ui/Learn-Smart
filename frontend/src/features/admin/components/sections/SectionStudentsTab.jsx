import { useMemo, useState } from "react";
import {
  Loader2,
  Search,
  UserPlus,
  Trash2,
  Users,
  AlertTriangle,
} from "lucide-react";
import Button from "../../../../components/ui/Button";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import AddSectionStudentsModal from "./AddSectionStudentsModal";
import {
  useGetSectionStudentsQuery,
  useAssignSectionStudentsMutation,
} from "../../../../store/api/realApi";
import { extractErrorMessage } from "../../../../utils/apiError";

export default function SectionStudentsTab({ section, onUpdated }) {
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const { data, isLoading, isError, error: qError, refetch } =
    useGetSectionStudentsQuery(section?.id, { skip: !section?.id });

  const [apply, { isLoading: saving }] = useAssignSectionStudentsMutation();

  const assigned = data?.assigned ?? [];
  const capacity = section?.capacity ?? 40;
  const currentCount = assigned.length;
  const atCapacityLimit = currentCount >= capacity;

  const filteredAssigned = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assigned;
    return assigned.filter(
      (s) =>
        (s.full_name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q)
    );
  }, [assigned, search]);

  // ---- Immediate remove ----
  async function doRemove(student) {
    setError("");
    setNotice("");
    setBusyId(student.enrollment_id);
    try {
      await apply({
        id: section.id,
        assign: [],
        unassign: [student.enrollment_id],
      }).unwrap();
      await refetch();
      onUpdated?.();
      setNotice(`${student.full_name} removed.`);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setBusyId(null);
      setConfirmRemove(null);
    }
  }

  // ---- After modal adds students ----
  async function handleAdded() {
    await refetch();
    onUpdated?.();
    setNotice("Students added.");
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="rounded-xl border border-coral-200 bg-coral-50 p-4 text-sm text-coral-700">
        {extractErrorMessage(qError)}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search section students…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-purple-400"
          />
        </div>

        {/* Capacity badge */}
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold uppercase tracking-wider " +
            (atCapacityLimit
              ? "bg-coral-50 text-coral-700 ring-1 ring-coral-100"
              : "bg-purple-50 text-purple-700 ring-1 ring-purple-100")
          }
        >
          <Users size={13} />
          {currentCount} / {capacity} Capacity
          {atCapacityLimit && <AlertTriangle size={12} className="ml-1" />}
        </span>

        {/* Add button */}
        <Button
          variant="primary"
          onClick={() => setAddModalOpen(true)}
          disabled={atCapacityLimit}
          title={atCapacityLimit ? "Capacity reached" : ""}
        >
          <UserPlus size={15} />
          Add Students
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-semibold text-coral-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          {notice}
        </div>
      )}

      {/* Roster table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {filteredAssigned.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
              <Users size={24} />
            </span>
            <p className="text-sm font-semibold text-navy-950">
              {assigned.length === 0
                ? "No students in this section yet"
                : "No students match your search"}
            </p>
            <p className="text-xs text-slate-400">
              {assigned.length === 0
                ? "Click \"Add Students\" to assign students from this grade."
                : "Try a different search term."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Student
                </th>
                <th className="hidden px-5 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500 sm:table-cell">
                  Enrollment
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAssigned.map((s) => {
                const isBusy = busyId === s.enrollment_id;
                return (
                  <tr
                    key={s.enrollment_id}
                    className="border-t border-slate-100 transition hover:bg-slate-50/50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[11px] font-bold text-purple-700">
                          {(s.full_name || s.email || "?")
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-navy-950">
                            {s.full_name}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {s.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 sm:table-cell">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setConfirmRemove(s)}
                        disabled={isBusy || saving}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-coral-200 hover:bg-coral-50 hover:text-coral-700 disabled:opacity-50"
                      >
                        {isBusy ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add students modal */}
      <AddSectionStudentsModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        section={section}
        onAdded={handleAdded}
      />

      {/* Remove confirmation */}
      <ConfirmDialog
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => confirmRemove && doRemove(confirmRemove)}
        title="Remove student from section?"
        description={
          confirmRemove
            ? `${confirmRemove.full_name} will be moved back to "Available" and can be re-added later.`
            : ""
        }
        confirmLabel="Remove"
        loading={saving}
      />
    </div>
  );
}