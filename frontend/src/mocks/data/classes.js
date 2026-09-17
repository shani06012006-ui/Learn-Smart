import { institutions, users, findUserById, serializeUser } from "./users";

let classes = [
  {
    id: "cls-phy10-anita",
    teacher_id: "usr-teacher-anita",
    institution_id: "inst-greenwood",
    name: "Grade 10 Physics",
    subject: "Physics",
    description: "Mechanics, motion, and Newton's laws.",
    is_archived: false,
    is_deleted: false,
    created_at: "2026-08-12T09:00:00+05:30",
  },
  {
    id: "cls-chem10-anita",
    teacher_id: "usr-teacher-anita",
    institution_id: "inst-greenwood",
    name: "Grade 10 Chemistry",
    subject: "Chemistry",
    description: "Periodic table, bonding, and reaction basics.",
    is_archived: false,
    is_deleted: false,
    created_at: "2026-08-14T09:00:00+05:30",
  },
  {
    id: "cls-phy10-vikram",
    teacher_id: "usr-teacher-vikram",
    institution_id: "inst-greenwood",
    name: "Grade 10 Physics - Sec B",
    subject: "Physics",
    description: "",
    is_archived: false,
    is_deleted: false,
    created_at: "2026-08-15T09:00:00+05:30",
  },
];

// Seed enrollments. Rahuls / Meera are already active. Arjun is pending so
// Screen 3's join flow has something to redeem (his code is PHY10C).
let enrollments = [
  {
    id: "enr-1",
    class_id: "cls-phy10-anita",
    student_id: "usr-student-rahul",
    joining_code: "PHY10A",
    status: "active",
    joined_at: "2026-08-13T10:00:00+05:30",
    created_at: "2026-08-13T10:00:00+05:30",
  },
  {
    id: "enr-2",
    class_id: "cls-phy10-anita",
    student_id: "usr-student-meera",
    joining_code: "PHY10B",
    status: "active",
    joined_at: "2026-08-13T11:00:00+05:30",
    created_at: "2026-08-13T11:00:00+05:30",
  },
  {
    id: "enr-3",
    class_id: "cls-phy10-anita",
    student_id: "usr-student-arjun",
    joining_code: "PHY10C",
    status: "pending",
    joined_at: null,
    created_at: "2026-08-13T12:00:00+05:30",
  },
  {
    id: "enr-4",
    class_id: "cls-chem10-anita",
    student_id: "usr-student-meera",
    joining_code: "CHEM10",
    status: "pending",
    joined_at: null,
    created_at: "2026-08-14T12:00:00+05:30",
  },
];

// ---------- reads ---------------------------------------------------------

export function findClassById(id) {
  return classes.find((c) => c.id === id && !c.is_deleted);
}

export function classesForTeacher(teacherId) {
  return classes.filter((c) => c.teacher_id === teacherId && !c.is_deleted);
}

export function classesForStudent(studentId) {
  const classIds = enrollments
    .filter((e) => e.student_id === studentId && e.status === "active")
    .map((e) => e.class_id);
  return classes.filter((c) => classIds.includes(c.id) && !c.is_deleted);
}

export function enrollmentsForClass(classId) {
  return enrollments.filter((e) => e.class_id === classId);
}

export function findEnrollmentByCode(code) {
  const normalized = String(code || "").toUpperCase().trim();
  return enrollments.find((e) => e.joining_code === normalized);
}

// ---------- writes --------------------------------------------------------

export function addClass({ teacherId, name, subject, description }) {
  const cls = {
    id: `cls-${Math.random().toString(36).slice(2, 10)}`,
    teacher_id: teacherId,
    institution_id: "inst-greenwood",
    name,
    subject,
    description: description || "",
    is_archived: false,
    is_deleted: false,
    created_at: new Date().toISOString(),
  };
  classes.push(cls);
  return cls;
}

export function softDeleteClass(id) {
  const cls = classes.find((c) => c.id === id);
  if (!cls) return false;
  cls.is_deleted = true;
  return true;
}

export function addStudentToClass(classId, { email, first_name, last_name }) {
  const normalizedEmail = email.toLowerCase().trim();

  let student = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!student) {
    student = {
      id: `usr-${Math.random().toString(36).slice(2, 10)}`,
      email: normalizedEmail,
      password: null,
      first_name,
      last_name,
      full_name: `${first_name} ${last_name}`,
      role: "student",
      institution: institutions[0],
      phone: "",
      avatar: null,
      is_blocked: false,
      is_online: false,
      date_joined: new Date().toISOString(),
    };
    users.push(student);
  }

  const existing = enrollments.find(
    (e) => e.class_id === classId && e.student_id === student.id
  );
  if (existing) return { enrollment: existing, created: false };

  const enrollment = {
    id: `enr-${Math.random().toString(36).slice(2, 10)}`,
    class_id: classId,
    student_id: student.id,
    joining_code: Math.random().toString(36).slice(2, 8).toUpperCase(),
    status: "pending",
    joined_at: null,
    created_at: new Date().toISOString(),
  };
  enrollments.push(enrollment);
  return { enrollment, created: true };
}

export function updateEnrollmentStatus(classId, enrollmentId, status) {
  const enrollment = enrollments.find(
    (e) => e.class_id === classId && e.id === enrollmentId
  );
  if (!enrollment) return null;
  enrollment.status = status;
  return enrollment;
}

// Student-initiated: redeem a joining code. Mirrors the backend
// join_class_with_code service: raises/returns a specific error string
// for each failure mode, otherwise activates the enrollment.
// Returns { ok: true, enrollment } or { ok: false, reason: "..." }.
export function redeemJoiningCode(studentId, code) {
  const enrollment = findEnrollmentByCode(code);
  if (!enrollment) {
    return { ok: false, reason: "not_found" };
  }
  if (enrollment.student_id !== studentId) {
    return { ok: false, reason: "not_owner" };
  }
  if (enrollment.status === "blocked") {
    return { ok: false, reason: "blocked" };
  }
  if (enrollment.status === "removed") {
    return { ok: false, reason: "removed" };
  }
  if (enrollment.status !== "active") {
    enrollment.status = "active";
    enrollment.joined_at = new Date().toISOString();
  }
  return { ok: true, enrollment };
}

// ---------- serializers ---------------------------------------------------

export function serializeClass(cls, { detail = false } = {}) {
  const student_count = enrollments.filter(
    (e) => e.class_id === cls.id && e.status === "active"
  ).length;

  const base = {
    id: cls.id,
    name: cls.name,
    subject: cls.subject,
    description: cls.description,
    teacher: cls.teacher_id,
    is_archived: cls.is_archived,
    student_count,
    created_at: cls.created_at,
  };

  if (detail) return { ...base, institution: cls.institution_id };
  return base;
}

export function serializeEnrollment(enrollment) {
  const student = findUserById(enrollment.student_id);
  return {
    id: enrollment.id,
    student: {
      id: enrollment.student_id,
      email: student?.email || "",
      first_name: student?.first_name || "",
      last_name: student?.last_name || "",
      full_name:
        student?.full_name ||
        `${student?.first_name || ""} ${student?.last_name || ""}`.trim(),
      is_online: !!student?.is_online,
      role: "student",
    },
    joining_code: enrollment.joining_code,
    status: enrollment.status,
    joined_at: enrollment.joined_at,
    invited_at: enrollment.created_at,
  };
}
