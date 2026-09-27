import PageHeader from "../../../components/ui/PageHeader";
import TimetableWeekView from "../../timetable/TimetableWeekView";
import { useGetTimetableQuery } from "../../../store/api/realApi";

export default function TeacherTimetableViewPage() {
  const { data, isLoading, isError, error, refetch } = useGetTimetableQuery();

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Your teaching schedule for the week."
      />
      <TimetableWeekView
        entries={data || []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyMessage="No timetable entries for your classes yet."
      />
    </div>
  );
}