// frontend/src/features/admin/pages/AdminSessionsPage.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Monitor, X, MoreVertical, LogOut, User,
  Globe, Calendar, AlertTriangle, ShieldOff, ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Pager from "../../../components/ui/Pager";
import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import {
  useGetAdminSessionsQuery,
  useRevokeAdminSessionMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const PAGE_SIZE = 20;

const STATUS_CHIPS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "revoked", label: "Revoked" },
  { value: "expired", label: "Expired" },
];

const STATUS_VARIANT = {
  active: "success",
  revoked: "danger",
  expired: "neutral",
};

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortUserAgent(ua) {
  if (!ua) return "—";
  return ua.split(" ")[0] || ua;
}

/* Row dropdown menu */
function RowMenu({ session, onRevoke, isRevoking }) {
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

  const canRevoke = session.status === "active";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Session actions"
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
            className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-elevated-lg"
          >
            {session.user?.id && (
              <Link
                to={`/admin/users/${session.user.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-navy-950"
              >
                <User size={13} />
                View user
              </Link>
            )}
            <div className="my-1 h-px bg-slate-100" />
            <button
              type="button"
              disabled={!canRevoke || isRevoking}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onRevoke();
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold transition-colors ${
                canRevoke
                  ? "text-coral-600 hover:bg-coral-50"
                  : "text-slate-300 cursor-not-allowed"
              } disabled:opacity-50`}
            >
              <LogOut size={13} />
              {canRevoke ? "Revoke session" : "Already revoked"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Small stat card */
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

/* Page */
export default function AdminSessionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmRevoke, setConfirmRevoke] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const queryParams = { page };
  if (statusFilter) queryParams.status = statusFilter;
  if (search.trim()) queryParams.q = search.trim();

  const { data, isLoading, isError, error, refetch } = useGetAdminSessionsQuery(queryParams);
  const [revokeSession, { isLoading: isRevoking }] = useRevokeAdminSessionMutation();

  const rows = data?.results || [];
  const count = data?.count || 0;

  const activeCount = rows.filter((s) => s.status === "active").length;
  const revokedCount = rows.filter((s) => s.status === "revoked").length;

  const handleRevoke = async (session) => {
    try {
      await revokeSession(session.id).unwrap();
      setConfirmRevoke(null);
    } catch {
      // Silent — the table refetches via tag invalidation.
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
            Sessions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Active logins across your platform. Revoke any session to sign the
            device out immediately.
          </p>
        </div>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatMini label="Total sessions" value={count} tone="purple" icon={Monitor} />
        <StatMini label="Active (this page)" value={activeCount} tone="emerald" icon={ShieldCheck} />
        <StatMini label="Revoked (this page)" value={revokedCount} tone="coral" icon={ShieldOff} />
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status chips */}
          <div className="flex items-center gap-1.5 rounded-full bg-slate-50 p-1">
            {STATUS_CHIPS.map((chip) => {
              const isActive = statusFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setStatusFilter(chip.value)}
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
              placeholder="Search device, IP, or user email"
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

          <span className="hidden shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 sm:inline-block">
            {count} {count === 1 ? "session" : "sessions"}
          </span>
        </div>
      </div>

      {/* Content */}
      {isLoading && <LoadingState label="Loading sessions..." />}

      {isError && <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />}

      {!isLoading && !isError && rows.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <Monitor size={26} strokeWidth={2} />
          </span>
          <h2 className="font-display text-xl font-extrabold text-navy-950">
            {statusFilter || search ? "No sessions match your filter" : "No sessions yet"}
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            {statusFilter || search
              ? "Try changing filters or clearing the search."
              : "Active logins will appear here as users sign in."}
          </p>
        </div>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            {/* Header row */}
            <div className="hidden grid-cols-[1.6fr_1.4fr_1fr_auto_auto_auto] items-center gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 lg:grid">
              <span>User</span>
              <span>Device</span>
              <span>IP</span>
              <span>Issued</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Rows */}
            <ul className="divide-y divide-slate-100">
              {rows.map((s) => {
                const initials =
                  (s.user?.full_name || s.user?.email || "?")
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase() || "?";

                return (
                  <li
                    key={s.id}
                    className="group px-5 py-4 transition-colors hover:bg-slate-50/60"
                  >
                    {/* Desktop layout */}
                    <div className="hidden grid-cols-[1.6fr_1.4fr_1fr_auto_auto_auto] items-center gap-4 lg:grid">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar userId={s.user?.id || s.id} initials={initials} size="md" />
                        <div className="min-w-0">
                          {s.user?.id ? (
                            <Link
                              to={`/admin/users/${s.user.id}`}
                              className="block truncate text-sm font-bold text-navy-950 transition-colors hover:text-purple-500"
                            >
                              {s.user?.full_name || "—"}
                            </Link>
                          ) : (
                            <p className="truncate text-sm font-bold text-navy-950">
                              {s.user?.full_name || "—"}
                            </p>
                          )}
                          <p className="truncate text-xs text-slate-400">{s.user?.email}</p>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold text-navy-950">
                          {s.device_label || "—"}
                        </span>
                        <span className="truncate text-xs text-slate-400">
                          {shortUserAgent(s.user_agent)}
                        </span>
                      </div>

                      <span className="truncate text-xs font-semibold text-slate-500 tabular-nums">
                        {s.ip_address || "—"}
                      </span>

                      <span className="whitespace-nowrap text-xs font-semibold text-slate-400">
                        {formatDateTime(s.issued_at)}
                      </span>

                      <Badge variant={STATUS_VARIANT[s.status] || "neutral"} dot>
                        {s.status}
                      </Badge>

                      <div className="flex justify-end">
                        <RowMenu
                          session={s}
                          onRevoke={() => setConfirmRevoke(s)}
                          isRevoking={isRevoking}
                        />
                      </div>
                    </div>

                    {/* Mobile layout */}
                    <div className="flex flex-col gap-3 lg:hidden">
                      <div className="flex items-start gap-3">
                        <Avatar userId={s.user?.id || s.id} initials={initials} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-navy-950">
                            {s.user?.full_name || "—"}
                          </p>
                          <p className="truncate text-xs text-slate-400">{s.user?.email}</p>
                        </div>
                        <RowMenu
                          session={s}
                          onRevoke={() => setConfirmRevoke(s)}
                          isRevoking={isRevoking}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <Badge variant={STATUS_VARIANT[s.status] || "neutral"} dot>
                          {s.status}
                        </Badge>
                        <span className="flex items-center gap-1.5">
                          <Monitor size={11} className="text-slate-300" />
                          {s.device_label || "—"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Globe size={11} className="text-slate-300" />
                          {s.ip_address || "—"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={11} className="text-slate-300" />
                          {formatDateTime(s.issued_at)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <Pager page={page} count={count} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}

      {/* Revoke confirmation */}
      <AnimatePresence>
        {confirmRevoke && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4 backdrop-blur-sm"
            onClick={() => !isRevoking && setConfirmRevoke(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-elevated-lg"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-50 text-coral-500">
                <AlertTriangle size={22} />
              </span>
              <h3 className="mt-4 font-display text-lg font-extrabold text-navy-950">
                Revoke this session?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                The user will be signed out on this device immediately. They can
                sign back in with their password.
              </p>

              <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs">
                <p className="flex items-center gap-2">
                  <Monitor size={12} className="text-slate-400" />
                  <span className="font-bold text-navy-950">Device:</span>
                  <span className="truncate text-slate-600">{confirmRevoke.device_label || "—"}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Globe size={12} className="text-slate-400" />
                  <span className="font-bold text-navy-950">IP:</span>
                  <span className="truncate text-slate-600 tabular-nums">{confirmRevoke.ip_address || "—"}</span>
                </p>
                <p className="flex items-center gap-2">
                  <User size={12} className="text-slate-400" />
                  <span className="font-bold text-navy-950">User:</span>
                  <span className="truncate text-slate-600">{confirmRevoke.user?.email || "—"}</span>
                </p>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setConfirmRevoke(null)}
                  disabled={isRevoking}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleRevoke(confirmRevoke)}
                  loading={isRevoking}
                >
                  <LogOut size={13} />
                  Revoke session
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}