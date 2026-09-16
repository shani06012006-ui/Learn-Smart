// This is the ONLY place mock account data lives. Handlers read/write this
// module; components never see it directly — they only ever see whatever
// RTK Query returns, exactly as they will against the real API.

export const institutions = [
  { id: "inst-greenwood", name: "Greenwood High School", slug: "greenwood-high" },
];

// `password` exists only so the login handler can check credentials — it is
// never returned in any API response, same as the real backend would never
// serialize a password hash back out.
export let users = [
  {
    id: "usr-teacher-anita",
    email: "anita.iyer@greenwood.edu",
    password: "password123",
    first_name: "Anita",
    last_name: "Iyer",
    full_name: "Anita Iyer",
    role: "teacher",
    institution: institutions[0],
    phone: "9876500001",
    avatar: null,
    is_blocked: false,
    is_online: true,
    date_joined: "2026-06-01T09:00:00+05:30",
  },
  {
    id: "usr-teacher-vikram",
    email: "vikram.rao@greenwood.edu",
    password: "password123",
    first_name: "Vikram",
    last_name: "Rao",
    full_name: "Vikram Rao",
    role: "teacher",
    institution: institutions[0],
    phone: "9876500002",
    avatar: null,
    is_blocked: false,
    is_online: false,
    date_joined: "2026-06-02T09:00:00+05:30",
  },
  {
    id: "usr-student-rahul",
    email: "rahul.sharma@example.com",
    password: "password123",
    first_name: "Rahul",
    last_name: "Sharma",
    full_name: "Rahul Sharma",
    role: "student",
    institution: institutions[0],
    phone: "9876500011",
    avatar: null,
    is_blocked: false,
    is_online: true,
    date_joined: "2026-06-10T10:00:00+05:30",
  },
  {
    id: "usr-student-meera",
    email: "meera.nair@example.com",
    password: "password123",
    first_name: "Meera",
    last_name: "Nair",
    full_name: "Meera Nair",
    role: "student",
    institution: institutions[0],
    phone: "9876500012",
    avatar: null,
    is_blocked: false,
    is_online: false,
    date_joined: "2026-06-11T10:00:00+05:30",
  },
  {
    id: "usr-student-arjun",
    email: "arjun.mehta@example.com",
    password: "password123",
    first_name: "Arjun",
    last_name: "Mehta",
    full_name: "Arjun Mehta",
    role: "student",
    institution: institutions[0],
    phone: "9876500013",
    avatar: null,
    is_blocked: false,
    is_online: true,
    date_joined: "2026-06-12T10:00:00+05:30",
  },
];

export function findUserByEmail(email) {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id) {
  return users.find((u) => u.id === id);
}

export function addUser(user) {
  users.push(user);
  return user;
}

export function updateUser(id, patch) {
  const user = findUserById(id);
  if (!user) return null;
  Object.assign(user, patch);
  if (patch.first_name || patch.last_name) {
    user.full_name = `${user.first_name} ${user.last_name}`;
  }
  return user;
}

// Strips password + is_blocked (internal-only) before anything goes back
// over the "wire" — mirrors what a DRF serializer would exclude.
export function serializeUser(user) {
  // eslint-disable-next-line no-unused-vars
  const { password, is_blocked, ...safe } = user;
  return safe;
}
