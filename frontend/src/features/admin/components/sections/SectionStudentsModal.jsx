import { useMemo, useState } from "react";
import { Loader2, Search, UserPlus, UserMinus, Users } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import {
  useGetSectionStudentsQuery,
  useAssignSectionStudentsMutation,
} from "../../../../store/api/realApi";
import { extractErrorMessage } from "../../../../utils/apiError";

export default function SectionStudentsModal({ open, onClose, section, onSaved }) {
  const [search, setSearch] = useState("");
  const [toAssign, setToAssign] = useState(() => new Set());
  const [toUnassign, setToUnassign] = useState(() => new Set());
  const [error, setError] = useState("");

  const { data, isLoading, refetch } = useGetSectionStudentsQuery(section?.id, {
    skip: !open || !section?.id,
  });
  const [apply, { isLoading: saving }] = useAssignSectionStudentsMutation();

  const assigned = data?.assigned ?? [];
  const candidates = data?.candidates ?? [];

  useMemo(() => {
    if (open) {
      setSearch("");
      setToAssign(new Set());
      setToUnassign(new Set());
      setError("");
    }
  }, [open, section?.id]);

  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (s) =>
        (s.full_name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q)
    );
  }, [candidates, search]);

  const toggleAssign = (enrollId) => {
    setToAssign((prev) => {
      const next = new Set(prev);
      if (next.has(enrollId)) next.delete(enrollId);
      else next.add(enrollId);
      return next;
    });
  };

  const toggleUnassign = (enrollId) => {
    setToUnassign((prev) => {
      const next = new Set(prev);
      if (next.has(enrollId)) next.delete(enrollId);
      else next.add(enrollId);
      return next;
    });
  };

  async function save() {
    setError("");
    try {
      await apply({
        id: section.id,
        assign: Array.from(toAssign),
        unassign: Array.from(toUnassign),
      }).unwrap();
      refetch();
      onSaved?.();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const hasChanges = toAssign.size > 0 || toUnassign.size > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Manage Students — Section ${section?.name || ""}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!hasChanges} loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      {error && (
        <p className="mb-3 rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-xs font-medium text-coral-700">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-slate-300" size={28} />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Currently assigned */}
          <section>
            <h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              <Users size={13} />
              In this section ({assigned.length})
            </h4>
            {assigned.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
                No students assigned yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {assigned.map((s) => {
                  const marked = toUnassign.has(s.enrollment_id);
                  return (
                    <li
                      key={s.enrollment_id}
                      className={
                        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 " +
                        (marked
                          ? "border-coral-200 bg-coral-50"
                          : "border-slate-100 bg-white")
                      }
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy-950">
                          {s.full_name}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {s.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleUnassign(s.enrollment_id)}
                        className={
                          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition " +
                          (marked
                            ? "bg-coral-100 text-coral-700 hover:bg-coral-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                        }
                      >
                        <UserMinus size={12} />
                        {marked ? "Will remove" : "Remove"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Candidates to add */}
          <section>
            <h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              <UserPlus size={13} />
              Available students ({filteredCandidates.length})
            </h4>
            <div className="relative mb-2">
              <Search
                size={13}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-purple-400"
              />
            </div>
            {filteredCandidates.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
                No available students in this grade.
              </p>
            ) : (
              <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
                {filteredCandidates.map((s) => {
                  const marked = toAssign.has(s.enrollment_id);
                  return (
                    <li
                      key={s.enrollment_id}
                      className={
                        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 " +
                        (marked
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-100 bg-white")
                      }
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy-950">
                          {s.full_name}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {s.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleAssign(s.enrollment_id)}
                        className={
                          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition " +
                          (marked
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                        }
                      >
                        <UserPlus size={12} />
                        {marked ? "Will add" : "Add"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}