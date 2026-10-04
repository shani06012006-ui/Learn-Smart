// frontend/src/features/admin/pages/AdminTeachersPage.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, UserCog, Plus, Shield, ShieldOff, MoreVertical,
  Eye, Pencil, Building2, Calendar, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Pager from "../../../components/ui/Pager";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import CreateUserModal from "../components/CreateUserModal";
import EditUserModal from "../components/EditUserModal";
import {
  useGetAdminUsersQuery,
  useToggleAdminUserActiveMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const PAGE_SIZE = 20;

const STATUS_CHIPS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ── Row dropdown menu ─────────────────────────────────────────── */
function RowMenu({ teacher, onView, onEdit, onToggle, isToggling }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Actions"
        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy-950"
      >
        <MoreVertical size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-elevated-lg"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onView();
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-navy-950"
            >
              <Eye size={13} />
              View profile
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-navy-950"
            >
              <Pencil size={13} />
              Edit details
            </button>
            <div className="my-1 h-px bg-slate-100" />
            <button
              type="button"
              disabled={isToggling}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onToggle();
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold transition-colors ${
                teacher.is_active
                  ? "text-coral-600 hover:bg-coral-50"
                  : "text-emerald-600 hover:bg-emerald-50"
              } disabled:opacity-50`}
            >
              {teacher.is_active ? <ShieldOff size={13} /> : <Shield size={13} />}
              {teacher.is_active ? "Deactivate" : "Activate"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */
export default function AdminTeachersPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [toggleActive, { isLoading: isToggling }] = useToggleAdminUserActiveMutation();
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, search]);

  const queryParams = { page, role: "teacher" };
  if (search.trim()) queryParams.q = search.trim();
  if (activeFilter === "active") queryParams.is_active = true;
  if (activeFilter === "inactive") queryParams.is_active = false;

  const { data, isLoading, isError, error, refetch } = useGetAdminUsersQuery(queryParams);

  const teachers = data?.results || [];
  const count = data?.count || 0;

  // Compute stats from current page (approx — the API supports is_active filter)
  const activeCount = teachers.filter((t) => t.is_active).length;
  const inactiveCount = teachers.length - activeCount;

  const handleToggle = async (teacher) => {
    setPendingId(teacher.id);
    try {
      await toggleActive({
        id: teacher.id,
        is_active: !teacher.is_active,
      }).unwrap();
    } catch {
      // Silent — the row will reflect the server state on refetch.
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Teachers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage teachers across your platform.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={15} />
          Add teacher
        </Button>
      </header>

      {/* ── Stats strip ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatMini
          label="Total teachers"
          value={count}
          tone="purple"
          icon={UserCog}
        />
        <StatMini
          label="Active (this page)"
          value={activeCount}
          tone="emerald"
          icon={Shield}
        />
        <StatMini
          label="Inactive (this page)"
          value={inactiveCount}
          tone="coral"
          icon={ShieldOff}
        />
      </div>

      {/* ── Filter bar ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status chips */}
          <div className="flex items-center gap-1.5 rounded-full bg-slate-50 p-1">
            {STATUS_CHIPS.map((chip) => {
              const isActive = activeFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setActiveFilter(chip.value)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-purple-500 text-white shadow-purple-glow"
                      : "text-slate-500 hover:text-navy-950"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative min-w-[14rem] flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-navy-950 placeholder:text-slate-400 outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy-950"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Count pill */}
          <span className="hidden shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 sm:inline-block">
            {count} {count === 1 ? "teacher" : "teachers"}
          </span>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      {isLoading && <LoadingState label="Loading teachers..." />}

      {isError && <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />}

      {!isLoading && !isError && teachers.length === 0 && (
        <EmptyTeachers onAdd={() => setCreateOpen(true)} hasFilter={!!activeFilter || !!search} />
      )}

      {!isLoading && !isError && teachers.length > 0 && (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            {/* Table header */}
            <div className="hidden grid-cols-[1.6fr_1fr_auto_auto_auto] items-center gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 lg:grid">
              <span>Teacher</span>
              <span>Institution</span>
              <span>Status</span>
              <span>Joined</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Rows */}
            <ul className="divide-y divide-slate-100">
              {teachers.map((t) => {
                const isPending = pendingId === t.id && isToggling;
                const initials =
                  (t.full_name || t.email || "?")
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase() || "?";

                return (
                  <li
                    key={t.id}
                    onClick={() => navigate(`/admin/teachers/${t.id}`)}
                    className="group cursor-pointer px-5 py-4 transition-colors hover:bg-slate-50/60"
                  >
                    {/* Desktop layout */}
                    <div className="hidden grid-cols-[1.6fr_1fr_auto_auto_auto] items-center gap-4 lg:grid">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar userId={t.id} initials={initials} size="md" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-navy-950 transition-colors group-hover:text-purple-500">
                            {t.full_name || "—"}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {t.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
                        <Building2 size={13} className="shrink-0 text-slate-300" />
                        <span className="truncate">
                          {t.institution?.name || "—"}
                        </span>
                      </div>

                      <Badge variant={t.is_active ? "success" : "danger"} dot>
                        {t.is_active ? "Active" : "Inactive"}
                      </Badge>

                      <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-slate-400">
                        <Calendar size={12} />
                        {formatDate(t.created_at)}
                      </span>

                      <div className="flex justify-end">
                        <RowMenu
                          teacher={t}
                          onView={() => navigate(`/admin/teachers/${t.id}`)}
                          onEdit={() => setEditUser(t)}
                          onToggle={() => handleToggle(t)}
                          isToggling={isPending}
                        />
                      </div>
                    </div>

                    {/* Mobile layout */}
                    <div className="flex flex-col gap-3 lg:hidden">
                      <div className="flex items-start gap-3">
                        <Avatar userId={t.id} initials={initials} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-navy-950">
                            {t.full_name || "—"}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {t.email}
                          </p>
                        </div>
                        <RowMenu
                          teacher={t}
                          onView={() => navigate(`/admin/teachers/${t.id}`)}
                          onEdit={() => setEditUser(t)}
                          onToggle={() => handleToggle(t)}
                          isToggling={isPending}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <Badge variant={t.is_active ? "success" : "danger"} dot>
                          {t.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <span className="flex items-center gap-1.5">
                          <Building2 size={11} className="text-slate-300" />
                          {t.institution?.name || "—"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={11} className="text-slate-300" />
                          {formatDate(t.created_at)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <Pager
            page={page}
            count={count}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultRole="teacher"
      />

      <EditUserModal
        open={!!editUser}
        user={editUser}
        onClose={() => {
          setEditUser(null);
          refetch();
        }}
      />
    </div>
  );
}

/* ── Small stat card ───────────────────────────────────────────── */
function StatMini({ label, value, tone = "purple", icon: Icon }) {
  const TONE = {
    purple:  { chip: "bg-purple-50 text-purple-600",  bar: "bg-purple-500" },
    emerald: { chip: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
    coral:   { chip: "bg-coral-50 text-coral-600",     bar: "bg-coral-500" },
  };
  const t = TONE[tone];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated">
      <span className={`absolute inset-x-0 top-0 h-1 ${t.bar} opacity-70 group-hover:opacity-100`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-extrabold tabular-nums text-navy-950">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.chip}`}>
          <Icon size={18} strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}

/* ── Empty state ───────────────────────────────────────────────── */
function EmptyTeachers({ onAdd, hasFilter }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
        <UserCog size={26} strokeWidth={2} />
      </span>
      <h2 className="font-display text-xl font-extrabold text-navy-950">
        {hasFilter ? "No teachers match your filter" : "No teachers yet"}
      </h2>
      <p className="max-w-md text-sm text-slate-500">
        {hasFilter
          ? "Try changing the status filter or clearing the search."
          : "Add the first teacher to your platform and they'll appear here."}
      </p>
      {!hasFilter && (
        <Button onClick={onAdd} className="mt-2">
          <Plus size={15} />
          Add teacher
        </Button>
      )}
    </div>
  );
}