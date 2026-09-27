import { useEffect, useState } from "react";
import { CalendarX } from "lucide-react";

import LoadingState from "../../../../components/feedback/LoadingState";
import ErrorState from "../../../../components/feedback/ErrorState";
import EmptyState from "../../../../components/ui/EmptyState";
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

  const { data, isLoading, isError, error, refetch } =
    useGetTeacherLeavesQuery(queryParams);

  const leaves = data?.results || [];
  const count = data?.count || 0;

  const hasActiveFilters =
    Boolean(status) ||
    Boolean(leaveType) ||
    Boolean(from) ||
    Boolean(to) ||
    Boolean(search.trim());

  const handleClear = () => {
    setStatus("");
    setLeaveType("");
    setFrom("");
    setTo("");
    setSearch("");
  };

  return (
    <div>
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

      {isError && (
        <ErrorState
          message={extractErrorMessage(error)}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && (
        <>
          {count === 0 && hasActiveFilters ? (
            <EmptyState
              icon={CalendarX}
              title="No matching teacher leaves"
              message="Try adjusting your filters to see more results."
              action={
                <Button variant="secondary" onClick={handleClear}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <LeavesTable leaves={leaves} onAction={onAction} />
              <Pager
                page={page}
                count={count}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}