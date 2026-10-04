// frontend/src/features/admin/components/leaves/TeacherLeavesTab.jsx
import { useEffect, useState } from "react";
import { CalendarX } from "lucide-react";

import LoadingState from "../../../../components/feedback/LoadingState";
import ErrorState from "../../../../components/feedback/ErrorState";
import Button from "../../../../components/ui/Button";
import Pager from "../../../../components/ui/Pager";
import LeavesFilters from "./LeavesFilters";
import LeavesTable from "./LeavesTable";
import { useGetTeacherLeavesQuery } from "../../../../store/api/realApi";
import { extractErrorMessage } from "../../../../utils/apiError";

const PAGE_SIZE = 20;

export default function TeacherLeavesTab({ onAction }) {
  const [status, setStatus] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [status, leaveType, from, to, search]);

  const queryParams = { page };
  if (status) queryParams.status = status;
  if (leaveType) queryParams.leave_type = leaveType;
  if (from) queryParams.from = from;
  if (to) queryParams.to = to;
  if (search.trim()) queryParams.q = search.trim();

  const { data, isLoading, isError, error, refetch } = useGetTeacherLeavesQuery(queryParams);

  const leaves = data?.results || [];
  const count = data?.count || 0;

  const hasActiveFilters =
    Boolean(status) || Boolean(leaveType) || Boolean(from) || Boolean(to) || Boolean(search.trim());

  const handleClear = () => {
    setStatus("");
    setLeaveType("");
    setFrom("");
    setTo("");
    setSearch("");
  };

  return (
    <div className="flex flex-col gap-5">
      <LeavesFilters
        status={status}
        leaveType={leaveType}
        from={from}
        to={to}
        search={search}
        onStatusChange={setStatus}
        onLeaveTypeChange={setLeaveType}
        onFromChange={setFrom}
        onToChange={setTo}
        onSearchChange={setSearch}
        onClear={handleClear}
      />

      {isLoading && <LoadingState label="Loading teacher leaves..." />}

      {isError && <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />}

      {!isLoading && !isError && (
        <>
          {count === 0 && hasActiveFilters ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
                <CalendarX size={26} strokeWidth={2} />
              </span>
              <h2 className="font-display text-xl font-extrabold text-navy-950">
                No matching teacher leaves
              </h2>
              <p className="max-w-md text-sm text-slate-500">
                Try adjusting your filters or clearing the search.
              </p>
              <Button variant="secondary" onClick={handleClear} className="mt-1">
                Clear filters
              </Button>
            </div>
          ) : count === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
                <CalendarX size={26} strokeWidth={2} />
              </span>
              <h2 className="font-display text-xl font-extrabold text-navy-950">
                No teacher leave requests yet
              </h2>
              <p className="max-w-md text-sm text-slate-500">
                Requests will appear here as teachers submit them.
              </p>
            </div>
          ) : (
            <>
              <LeavesTable leaves={leaves} onAction={onAction} />
              <Pager page={page} count={count} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </>
          )}
        </>
      )}
    </div>
  );
}