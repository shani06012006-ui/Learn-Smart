import { institutions, users, findUserById, serializeUser } from "./users";

const teacherAnita = users.find((u) => u.id === "usr-teacher-anita");
const teacherVikram = users.find((u) => u.id === "usr-teacher-vikram");

// --- Classes ----------------------------------------------------------
// Matches classes.ClassCourse + ClassCourseSerializer exactly: id, name,
// subject, description, teacher{}, is_archived, student_count, created_at
// (institution is added only in the detail serializer).
export let classes = [
  {
    id: "cls-physics-10",
    institution: institutions[0],
    teacher_id: teacherAnita.id,
    name: "Grade 10 Physics",
    subject: "Physics",
    description: "CBSE Grade 10 Physics — mechanics, optics, electricity.",
    is_archived: false,
    is_deleted: false,
    created_at: "2026-06-15T09:00:00+05:30",
  },
  {
    id: "cls-chem-9",
    institution: institutions[0],
    teacher_id: teacherAnita.id,
    name: "Grade 9 Chemistry",
    subject: "Chemistry",
    description: "Introductory chemistry — atomic structure, periodic table, bonding.",
    is_archived: false,
    is_deleted: false,
    created_at: "2026-06-18T09:00:00+05:30",
  },
  {
    id: "cls-bio-11",
    institution: institutions[0],
    teacher_id: teacherAnita.id,
    name: "Grade 11 Biology",
    subject: "Biology",
    description: "",
    is_archived: false,
    is_deleted: false,
    created_at: "2026-07-01T09:00:00+05:30",
  },
  {
    id: "cls-math-10",
    institution: institutions[0],
    teacher_id: teacherVikram.id,
    name: "Grade 10 Mathematics",
    subject: "Mathematics",
    description: "Algebra, trigonometry, and coordinate geometry.",
    is_archived: false,
    is_deleted: false,
    created_at: "2026-06-20T09:00:00+05:30",
  },
];

// --- Enrollments --------------------------------------------------------
// Matches StudentEnrollment + StudentEnrollmentSerializer: id, student{},
// joining_code, status, joined_at, invited_at.
export let enrollments = [
  {
    id: "enr-1",
    student_id: "usr-student-rahul",
    class_course_id: "cls-physics-10",
    joining_code: "7K2QX9",
    status: "active",
    joined_at: "2026-06-16T10:15:00+05:30",
    created_at: "2026-06-15T11:00:00+05:30",
  },
  {
    id: "enr-2",
    student_id: "usr-student-meera",
    class_course_id: "cls-physics-10",
    joining_code: "4RT8MN",
    status: "active",
    joined_at: "2026-06-17T08:30:00+05:30",
    created_at: "2026-06-15T11:05:00+05:30",
  },
  {
    id: "enr-3",
    student_id: "usr-student-arjun",
    class_course_id: "cls-physics-10",
    joining_code: "9PL3WD",
    status: "pending", // invited, hasn't redeemed the code yet
    joined_at: null,
    created_at: "2026-06-20T09:00:00+05:30",
  },
  {
    id: "enr-4",
    student_id: "usr-student-rahul",
    class_course_id: "cls-chem-9",
    joining_code: "2XZ7YB",
    status: "active",
    joined_at: "2026-06-19T14:00:00+05:30",
    created_at: "2026-06-18T09:30:00+05:30",
  },
  {
    id: "enr-5",
    student_id: "usr-student-meera",
    class_course_id: "cls-chem-9",
    joining_code: "5QA1RC",
    status: "blocked", // demonstrates the blocked state in the roster UI
    joined_at: "2026-06-19T15:00:00+05:30",
    created_at: "2026-06-18T09:35:00+05:30",
  },
];

// --- Helpers --------------------------------------------------------------

function studentCount(classId) {
  return enrollments.filter((e) => e.class_course_id === classId && e.status === "active").length;
}

export function serializeClass(cls, { detail = false } = {}) {
  const base = {
    id: cls.id,
    name: cls.name,
    subject: cls.subject,
    description: cls.description,
    teacher: serializeUser(findUserById(cls.teacher_id)),
    is_archived: cls.is_archived,
    student_count: studentCount(cls.id),
    created_at: cls.created_at,
  };
  return detail ? { ...base, institution: cls.institution } : base;
}

export function serializeEnrollment(enr) {
  return {
    id: enr.id,
    student: serializeUser(findUserById(enr.student_id)),
    joining_code: enr.joining_code,
    status: enr.status,
    joined_at: enr.joined_at,
    invited_at: enr.created_at,
  };
}

export function findClassById(id) {
  return classes.find((c) => c.id === id && !c.is_deleted);
}

export function classesForTeacher(teacherId) {
  return classes.filter((c) => c.teacher_id === teacherId && !c.is_deleted);
}

export function classesForStudent(studentId) {
  const activeClassIds = enrollments
    .filter((e) => e.student_id === studentId && e.status === "active")
    .map((e) => e.class_course_id);
  return classes.filter((c) => activeClassIds.includes(c.id) && !c.is_deleted);
}

export function enrollmentsForClass(classId) {
  return enrollments.filter((e) => e.class_course_id === classId);
}

function randomJoiningCode() {
  // Same alphabet as the real backend: excludes ambiguous 0/O/1/I.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (enrollments.some((e) => e.joining_code === code));
  return code;
}

export function addClass({ teacherId, name, subject, description }) {
  const cls = {
    id: `cls-${Math.random().toString(36).slice(2, 10)}`,
    institution: institutions[0],
    teacher_id: teacherId,
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

export function softDeleteClass(classId) {
  const cls = findClassById(classId);
  if (cls) cls.is_deleted = true;
  return cls;
}

export function addStudentToClass(classId, { email, first_name, last_name }) {
  let student = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  let studentCreated = false;

  if (!student) {
    student = {
      id: `usr-${Math.random().toString(36).slice(2, 10)}`,
      email,
      password: null, // unusable password, same as the real backend until the account is claimed
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
    studentCreated = true;
  }

  let enrollment = enrollments.find(
    (e) => e.student_id === student.id && e.class_course_id === classId
  );
  let enrollmentCreated = false;

  if (!enrollment) {
    enrollment = {
      id: `enr-${Math.random().toString(36).slice(2, 10)}`,
      student_id: student.id,
      class_course_id: classId,
      joining_code: randomJoiningCode(),
      status: "pending",
      joined_at: null,
      created_at: new Date().toISOString(),
    };
    enrollments.push(enrollment);
    enrollmentCreated = true;
  }

  return { enrollment, created: studentCreated || enrollmentCreated };
}

export function updateEnrollmentStatus(classId, enrollmentId, status) {
  const enrollment = enrollments.find((e) => e.id === enrollmentId && e.class_course_id === classId);
  if (!enrollment) return null;
  enrollment.status = status;
  return enrollment;
}
