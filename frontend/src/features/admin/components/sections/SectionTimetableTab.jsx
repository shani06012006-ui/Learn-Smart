import { Loader2 } from "lucide-react";
import ClassTimetableGrid from "../timetable/ClassTimetableGrid";
import { useGetAdminTimetableQuery } from "../../../../store/api/realApi";
import { extractErrorMessage } from "../../../../utils/apiError";

export default function SectionTimetableTab({ section, gradeName }) {
  const { data, isLoading, isError, error } = useGetAdminTimetableQuery(
    { section: section?.id },
    { skip: !section?.id }
  );

  const entries = data?.results ?? data ?? [];

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
        {extractErrorMessage(error)}
      </p>
    );
  }

  return (
    <ClassTimetableGrid
      entries={entries}
      title={`${gradeName} · Section ${section?.name}`}
      subtitle="Weekly Schedule"
      workingDays={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]}
      periodsPerDay={8}
      periodMinutes={45}
      startTime="08:00"
      breakAfterPeriod={4}
      breakMinutes={15}
    />
  );
}