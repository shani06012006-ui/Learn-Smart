import Table from "../../../../components/ui/Table";
import Badge from "../../../../components/ui/Badge";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function percentBadgeVariant(p) {
  if (p >= 75) return "success";
  if (p >= 50) return "warning";
  return "danger";
}

export default function RecentAssessmentsTable({ assessments }) {
  const columns = [
    {
      key: "exam_label",
      header: "Assessment",
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.exam_label}</p>
          <p className="text-xs text-ink-500">{row.class_name}</p>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (row) => <span className="text-sm text-ink-700">{row.subject}</span>,
    },
    {
      key: "percent",
      header: "Score",
      render: (row) => (
        <Badge variant={percentBadgeVariant(row.percent)}>{row.percent}%</Badge>
      ),
    },
    {
      key: "time_taken_sec",
      header: "Time taken",
      render: (row) => (
        <span className="text-sm text-ink-700">{formatDuration(row.time_taken_sec)}</span>
      ),
    },
    {
      key: "completed_at",
      header: "Completed",
      render: (row) => (
        <span className="text-sm text-ink-700">{formatDate(row.completed_at)}</span>
      ),
    },
  ];

  return (
    <section>
      <div className="mb-3">
        <h2 className="font-semibold text-ink-900">Recent Assessments</h2>
        <p className="text-xs text-ink-500">Your last few completed quizzes and exams.</p>
      </div>

      {assessments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-300 py-8 text-center text-sm text-ink-500">
          No assessments yet.
        </p>
      ) : (
        <div className="rounded-xl bg-white p-1">
          <Table columns={columns} data={assessments} />
        </div>
      )}
    </section>
  );
}
