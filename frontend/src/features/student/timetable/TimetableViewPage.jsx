import PageHeader from "../../../components/ui/PageHeader";
import TimetableWeekView from "../../timetable/TimetableWeekView";
import { useGetTimetableQuery } from "../../../store/api/realApi";

export default function StudentTimetableViewPage() {
  const { data, isLoading, isError, error, refetch } = useGetTimetableQuery();

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Your weekly class schedule."
      />
      <TimetableWeekView
        entries={data || []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyMessage="No timetable entries for your enrolled classes yet."
      />
    </div>
  );
}