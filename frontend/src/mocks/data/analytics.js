// Fixed analytics dataset for the teacher dashboard. Numbers are chosen to
// match the proposal's worked examples exactly so the widgets render with
// the same story the design document describes:
//
//   🔴 Rahul — 48% Physics, Weak Topic: Projectile Motion, decreasing
//   🟢 Meera — 78% Chemistry, +15% improvement
//
// This module is deliberately static (no per-request randomness). Future
// modules (exams, auto-grading) will compute these from real submissions;
// for now they are the authoritative mock the dashboard binds to.

export const dashboardAnalytics = {
  needs_attention: [
    {
      student_id: "usr-student-rahul",
      student_name: "Rahul Sharma",
      class_id: "cls-phy10-anita",
      class_name: "Grade 10 Physics",
      subject: "Physics",
      percent: 48,
      weak_topic: "Projectile Motion",
      trend: "decreasing",
      detail: "Performance has decreased compared with the previous exam.",
    },
    {
      student_id: "usr-student-arjun",
      student_name: "Arjun Mehta",
      class_id: "cls-phy10-anita",
      class_name: "Grade 10 Physics",
      subject: "Physics",
      percent: 42,
      weak_topic: "Free-body Diagrams",
      trend: "decreasing",
      detail: "Two consecutive assessments below 50%.",
    },
  ],

  needs_improvement: [
    {
      student_id: "usr-student-arjun",
      student_name: "Arjun Mehta",
      class_id: "cls-chem10-anita",
      class_name: "Grade 10 Chemistry",
      subject: "Chemistry",
      percent: 62,
      weak_topic: "Chemical Bonding",
      trend: "flat",
      detail: "Stable but below the class average of 74%.",
    },
  ],

  improving: [
    {
      student_id: "usr-student-meera",
      student_name: "Meera Nair",
      class_id: "cls-chem10-anita",
      class_name: "Grade 10 Chemistry",
      subject: "Chemistry",
      percent: 78,
      weak_topic: null,
      trend: "improving",
      detail: "Performance has improved by 15% since the last assessment.",
      delta_percent: 15,
    },
    {
      student_id: "usr-student-rahul",
      student_name: "Rahul Sharma",
      class_id: "cls-chem10-anita",
      class_name: "Grade 10 Chemistry",
      subject: "Chemistry",
      percent: 71,
      weak_topic: null,
      trend: "improving",
      detail: "Improved from 64% to 71% over the last two quizzes.",
      delta_percent: 7,
    },
  ],

  weak_topics: [
    {
      topic: "Projectile Motion",
      subject: "Physics",
      error_rate: 62, // percentage of questions on this topic answered wrong
      class_count: 2,
    },
    {
      topic: "Free-body Diagrams",
      subject: "Physics",
      error_rate: 54,
      class_count: 2,
    },
    {
      topic: "Chemical Bonding",
      subject: "Chemistry",
      error_rate: 41,
      class_count: 1,
    },
    {
      topic: "Stoichiometry",
      subject: "Chemistry",
      error_rate: 38,
      class_count: 1,
    },
  ],

  // Per-class trend over the last 4–5 assessments. Each series entry is one
  // assessment; exam_label is what shows on the chart x-axis.
  trends: [
    {
      class_id: "cls-phy10-anita",
      class_name: "Grade 10 Physics",
      subject: "Physics",
      series: [
        { exam_label: "Quiz 1", average_percent: 68 },
        { exam_label: "Quiz 2", average_percent: 64 },
        { exam_label: "Mid-term", average_percent: 59 },
        { exam_label: "Quiz 3", average_percent: 55 },
        { exam_label: "Quiz 4", average_percent: 52 },
      ],
    },
    {
      class_id: "cls-chem10-anita",
      class_name: "Grade 10 Chemistry",
      subject: "Chemistry",
      series: [
        { exam_label: "Quiz 1", average_percent: 61 },
        { exam_label: "Quiz 2", average_percent: 66 },
        { exam_label: "Mid-term", average_percent: 70 },
        { exam_label: "Quiz 3", average_percent: 73 },
        { exam_label: "Quiz 4", average_percent: 76 },
      ],
    },
  ],
};

// Recommendations are computed from the analytics above so they respond to
// changes in the underlying counts. The template ("X students need
// additional support in Y") shifts as data changes; the impact line is
// hardcoded per kind because it's editorial, not derived.

export function buildRecommendations(analytics) {
  const recs = [];

  const attentionCount = analytics.needs_attention.length;
  if (attentionCount > 0) {
    recs.push({
      kind: "attention",
      title: `${attentionCount} ${attentionCount === 1 ? "student needs" : "students need"} additional support`,
      body: "Consider scheduling a one-on-one review session or assigning targeted practice.",
    });
  }

  const weakest = [...analytics.weak_topics].sort((a, b) => b.error_rate - a.error_rate)[0];
  if (weakest) {
    recs.push({
      kind: "weak_topic",
      title: `${weakest.topic} is a difficult topic for most students`,
      body: `Reinforce ${weakest.topic} with worked examples and additional practice problems.`,
    });
  }

  const improvingCount = analytics.improving.length;
  if (improvingCount > 0) {
    recs.push({
      kind: "improving",
      title: `${improvingCount} ${improvingCount === 1 ? "student is" : "students are"} showing improvement`,
      body: "Keep reinforcing recent gains — consider sharing positive feedback with the class.",
    });
  }

  const declining = analytics.trends.filter((t) => {
    const s = t.series;
    if (s.length < 2) return false;
    return s[s.length - 1].average_percent < s[0].average_percent;
  });
  if (declining.length > 0) {
    recs.push({
      kind: "trend_down",
      title: `Class average is declining in ${declining.map((t) => t.subject).join(" and ")}`,
      body: "Review the last two assessments together to identify where students are getting stuck.",
    });
  }

  return recs;
}
