// Per-student performance dataset. Keyed by user ID so each logged-in
// student sees their own numbers -- mirrors how the real backend would
// scope the /student/performance/ response by request.user.
//
// Values align with the teacher-side analytics dataset so the two views
// tell the same story:
//   - Rahul shows up in "Needs Attention" (Physics 48%) and "Improving"
//     (Chemistry 71%, +7%).
//   - Meera shows up in "Improving" (Chemistry 78%, +15%).
//   - Arjun shows up in "Needs Attention" (Physics 42%) and
//     "Needs Improvement" (Chemistry 62%).
//
// The overall summary block computes `level` from `average_percent` using
// the proposal's thresholds (Excellent 90-100, Very Good 75-89,
// Average 50-74, Needs Improvement below 50).

function computeLevel(averagePercent) {
  if (averagePercent >= 90) return { level: "excellent", label: "Excellent" };
  if (averagePercent >= 75) return { level: "very_good", label: "Very Good" };
  if (averagePercent >= 50) return { level: "average", label: "Average" };
  return { level: "needs_improvement", label: "Needs Improvement" };
}

const BY_STUDENT = {
  "usr-student-rahul": {
    overall: {
      average_percent: 62,
      accuracy: 71,
      completion_rate: 92,
      avg_time_per_question_sec: 48,
    },
    strong_topics: [
      { topic: "Kinematics", subject: "Physics", percent: 82 },
      { topic: "Periodic Trends", subject: "Chemistry", percent: 79 },
    ],
    weak_topics: [
      { topic: "Projectile Motion", subject: "Physics", percent: 38 },
      { topic: "Free-body Diagrams", subject: "Physics", percent: 44 },
      { topic: "Chemical Bonding", subject: "Chemistry", percent: 51 },
    ],
    trends: [
      {
        class_id: "cls-phy10-anita",
        class_name: "Grade 10 Physics",
        subject: "Physics",
        series: [
          { exam_label: "Quiz 1", percent: 72 },
          { exam_label: "Quiz 2", percent: 65 },
          { exam_label: "Mid-term", percent: 55 },
          { exam_label: "Quiz 3", percent: 50 },
          { exam_label: "Quiz 4", percent: 48 },
        ],
      },
      {
        class_id: "cls-chem10-anita",
        class_name: "Grade 10 Chemistry",
        subject: "Chemistry",
        series: [
          { exam_label: "Quiz 1", percent: 60 },
          { exam_label: "Quiz 2", percent: 64 },
          { exam_label: "Quiz 3", percent: 68 },
          { exam_label: "Quiz 4", percent: 71 },
        ],
      },
    ],
    recent_assessments: [
      {
        id: "asmt-r-1",
        class_name: "Grade 10 Physics",
        subject: "Physics",
        exam_label: "Quiz 4",
        percent: 48,
        time_taken_sec: 1380,
        completed_at: "2026-09-12T11:30:00+05:30",
      },
      {
        id: "asmt-r-2",
        class_name: "Grade 10 Chemistry",
        subject: "Chemistry",
        exam_label: "Quiz 4",
        percent: 71,
        time_taken_sec: 1140,
        completed_at: "2026-09-10T10:00:00+05:30",
      },
      {
        id: "asmt-r-3",
        class_name: "Grade 10 Physics",
        subject: "Physics",
        exam_label: "Quiz 3",
        percent: 50,
        time_taken_sec: 1500,
        completed_at: "2026-08-28T11:00:00+05:30",
      },
      {
        id: "asmt-r-4",
        class_name: "Grade 10 Chemistry",
        subject: "Chemistry",
        exam_label: "Quiz 3",
        percent: 68,
        time_taken_sec: 1200,
        completed_at: "2026-08-22T10:30:00+05:30",
      },
      {
        id: "asmt-r-5",
        class_name: "Grade 10 Physics",
        subject: "Physics",
        exam_label: "Mid-term",
        percent: 55,
        time_taken_sec: 2700,
        completed_at: "2026-08-15T09:00:00+05:30",
      },
    ],
  },

  "usr-student-meera": {
    overall: {
      average_percent: 78,
      accuracy: 84,
      completion_rate: 100,
      avg_time_per_question_sec: 42,
    },
    strong_topics: [
      { topic: "Periodic Trends", subject: "Chemistry", percent: 91 },
      { topic: "Chemical Bonding", subject: "Chemistry", percent: 86 },
      { topic: "Kinematics", subject: "Physics", percent: 82 },
    ],
    weak_topics: [
      { topic: "Stoichiometry", subject: "Chemistry", percent: 62 },
    ],
    trends: [
      {
        class_id: "cls-phy10-anita",
        class_name: "Grade 10 Physics",
        subject: "Physics",
        series: [
          { exam_label: "Quiz 1", percent: 74 },
          { exam_label: "Quiz 2", percent: 78 },
          { exam_label: "Mid-term", percent: 80 },
          { exam_label: "Quiz 3", percent: 79 },
          { exam_label: "Quiz 4", percent: 82 },
        ],
      },
      {
        class_id: "cls-chem10-anita",
        class_name: "Grade 10 Chemistry",
        subject: "Chemistry",
        series: [
          { exam_label: "Quiz 1", percent: 63 },
          { exam_label: "Quiz 2", percent: 68 },
          { exam_label: "Quiz 3", percent: 73 },
          { exam_label: "Quiz 4", percent: 78 },
        ],
      },
    ],
    recent_assessments: [
      {
        id: "asmt-m-1",
        class_name: "Grade 10 Chemistry",
        subject: "Chemistry",
        exam_label: "Quiz 4",
        percent: 78,
        time_taken_sec: 1080,
        completed_at: "2026-09-12T11:30:00+05:30",
      },
      {
        id: "asmt-m-2",
        class_name: "Grade 10 Physics",
        subject: "Physics",
        exam_label: "Quiz 4",
        percent: 82,
        time_taken_sec: 1020,
        completed_at: "2026-09-11T10:00:00+05:30",
      },
      {
        id: "asmt-m-3",
        class_name: "Grade 10 Chemistry",
        subject: "Chemistry",
        exam_label: "Quiz 3",
        percent: 73,
        time_taken_sec: 1140,
        completed_at: "2026-08-28T11:00:00+05:30",
      },
      {
        id: "asmt-m-4",
        class_name: "Grade 10 Physics",
        subject: "Physics",
        exam_label: "Quiz 3",
        percent: 79,
        time_taken_sec: 1100,
        completed_at: "2026-08-24T10:30:00+05:30",
      },
      {
        id: "asmt-m-5",
        class_name: "Grade 10 Chemistry",
        subject: "Chemistry",
        exam_label: "Quiz 2",
        percent: 68,
        time_taken_sec: 1200,
        completed_at: "2026-08-15T09:00:00+05:30",
      },
    ],
  },

  "usr-student-arjun": {
    overall: {
      average_percent: 42,
      accuracy: 54,
      completion_rate: 68,
      avg_time_per_question_sec: 72,
    },
    strong_topics: [
      { topic: "Kinematics", subject: "Physics", percent: 66 },
    ],
    weak_topics: [
      { topic: "Free-body Diagrams", subject: "Physics", percent: 31 },
      { topic: "Projectile Motion", subject: "Physics", percent: 35 },
      { topic: "Chemical Bonding", subject: "Chemistry", percent: 40 },
    ],
    trends: [
      {
        class_id: "cls-phy10-anita",
        class_name: "Grade 10 Physics",
        subject: "Physics",
        series: [
          { exam_label: "Quiz 1", percent: 55 },
          { exam_label: "Quiz 2", percent: 48 },
          { exam_label: "Mid-term", percent: 44 },
          { exam_label: "Quiz 3", percent: 42 },
        ],
      },
    ],
    recent_assessments: [
      {
        id: "asmt-a-1",
        class_name: "Grade 10 Physics",
        subject: "Physics",
        exam_label: "Quiz 3",
        percent: 42,
        time_taken_sec: 1620,
        completed_at: "2026-09-08T11:00:00+05:30",
      },
      {
        id: "asmt-a-2",
        class_name: "Grade 10 Physics",
        subject: "Physics",
        exam_label: "Mid-term",
        percent: 44,
        time_taken_sec: 2880,
        completed_at: "2026-08-20T10:00:00+05:30",
      },
      {
        id: "asmt-a-3",
        class_name: "Grade 10 Physics",
        subject: "Physics",
        exam_label: "Quiz 2",
        percent: 48,
        time_taken_sec: 1500,
        completed_at: "2026-08-06T11:30:00+05:30",
      },
    ],
  },
};

// Returns null if the student has no performance data yet (fresh account).
export function performanceForStudent(studentId) {
  const raw = BY_STUDENT[studentId];
  if (!raw) return null;

  const { level, label } = computeLevel(raw.overall.average_percent);

  return {
    overall: {
      ...raw.overall,
      level,
      level_label: label,
    },
    strong_topics: raw.strong_topics,
    weak_topics: raw.weak_topics,
    trends: raw.trends,
    recent_assessments: raw.recent_assessments,
  };
}

// Empty-performance envelope used when a student has no data yet (e.g. a
// freshly-registered student who hasn't taken any assessments). Mirrors
// what the real endpoint would return for an empty result set -- not a
// 404, because the student is valid and just has no data.
export function emptyPerformance() {
  return {
    overall: {
      average_percent: 0,
      accuracy: 0,
      completion_rate: 0,
      avg_time_per_question_sec: 0,
      level: "needs_improvement",
      level_label: "Needs Improvement",
    },
    strong_topics: [],
    weak_topics: [],
    trends: [],
    recent_assessments: [],
  };
}
