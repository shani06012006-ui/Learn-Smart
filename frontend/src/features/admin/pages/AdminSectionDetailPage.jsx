import { useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, Users, Calendar } from "lucide-react";

import LoadingState from "../../../components/feedback/LoadingState";
import ErrorState from "../../../components/feedback/ErrorState";
import EditSectionModal from "../components/sections/EditSectionModal";
import SectionHeader from "../components/sections/SectionHeader";
import SectionOverviewTab from "../components/sections/SectionOverviewTab";
import SectionStudentsTab from "../components/sections/SectionStudentsTab";
import SectionTimetableTab from "../components/sections/SectionTimetableTab";
import {
  useGetGradesQuery,
  useGetAdminSectionsQuery,
  useGetSectionStudentsQuery,
  useGetAdminTimetableQuery,
  useDeleteAdminSectionMutation,
} from "../../../store/api/realApi";
import { extractErrorMessage } from "../../../utils/apiError";

const TABS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "students", label: "Students", icon: Users },
  { id: "timetable", label: "Timetable", icon: Calendar },
];

const VALID_TABS = new Set(TABS.map((t) => t.id));

export default function AdminSectionDetailPage() {
  const { gradeId, sectionId } = useParams();
  const navigate = useNavigate();

  // Tab state lives in URL: ?tab=overview (default)
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const tab = VALID_TABS.has(urlTab) ? urlTab : "overview";

  const setTab = (nextTab) => {
    const params = new URLSearchParams(searchParams);
    if (nextTab === "overview") {
      params.delete("tab"); // clean URL for default tab
    } else {
      params.set("tab", nextTab);
    }
    setSearchParams(params, { replace: true });
  };

  const [editOpen, setEditOpen] = useState(false);

  const { data: gradesData } = useGetGradesQuery();
  const grades = gradesData?.results ?? gradesData ?? [];
  const grade = grades.find((g) => g.id === gradeId);

  const { data: sectionsData, refetch: refetchSections } = useGetAdminSectionsQuery({});
  const sections = sectionsData?.results ?? sectionsData ?? [];
  const section = sections.find((s) => s.id === sectionId);

  const { data: studentData, refetch: refetchStudents } = useGetSectionStudentsQuery(
    sectionId,
    { skip: !sectionId }
  );

  const { data: timetableData } = useGetAdminTimetableQuery(
    { section: sectionId },
    { skip: !sectionId }
  );

  const [deleteSection, { isLoading: deleting }] = useDeleteAdminSectionMutation();

  const stats = useMemo(() => {
    const enrolled = studentData?.assigned?.length ?? 0;

    const entries = timetableData?.results ?? timetableData ?? [];
    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const todays = entries
      .filter((e) => e.day_of_week === todayIdx)
      .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
      .slice(0, 3)
      .map((e) => ({
        day: "Today",
        start: String(e.start_time).slice(0, 5),
        end: String(e.end_time).slice(0, 5),
        subject: e.class_course?.subject || e.class_course?.name || "",
      }));

    let nextClasses = todays;
    if (nextClasses.length === 0) {
      nextClasses = entries
        .filter((e) => e.day_of_week > todayIdx)
        .sort(
          (a, b) =>
            a.day_of_week - b.day_of_week ||
            String(a.start_time).localeCompare(String(b.start_time))
        )
        .slice(0, 3)
        .map((e) => ({
          day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][e.day_of_week],
          start: String(e.start_time).slice(0, 5),
          end: String(e.end_time).slice(0, 5),
          subject: e.class_course?.subject || e.class_course?.name || "",
        }));
    }

    return { enrolled, next_classes: nextClasses };
  }, [studentData, timetableData]);

  async function handleDelete() {
    if (!section) return;
    if (!window.confirm(`Delete section "${section.name}"?`)) return;
    try {
      await deleteSection(section.id).unwrap();
      navigate("/admin/grades");
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  if (!grade || !section) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <p className="text-sm font-semibold text-navy-950">Section not found</p>
        <button
          onClick={() => navigate("/admin/grades")}
          className="text-xs font-bold text-purple-600 hover:text-purple-700"
        >
          ← Back to Grades
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        section={section}
        gradeName={grade.name}
        stats={stats}
        onEdit={() => setEditOpen(true)}
        onDelete={handleDelete}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition " +
                (active
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-slate-500 hover:text-navy-950")
              }
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab body */}
      {tab === "overview" && (
        <SectionOverviewTab
          section={section}
          stats={stats}
          onManageStudents={() => setTab("students")}
        />
      )}
      {tab === "students" && (
        <SectionStudentsTab section={section} onUpdated={refetchStudents} />
      )}
      {tab === "timetable" && (
        <SectionTimetableTab section={section} gradeName={grade.name} />
      )}

      <EditSectionModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        section={section}
        onSaved={() => refetchSections()}
      />
    </div>
  );
}