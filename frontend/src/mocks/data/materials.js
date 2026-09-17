// In-memory store for Material + Announcement mock data. Shapes mirror
// the future backend/materials/models.py models. Handlers read/write this
// module; components never see it directly.

// ---------- materials -----------------------------------------------------

let materials = [
  {
    id: "mat-phy10-1",
    class_id: "cls-phy10-anita",
    title: "Newton's Laws — Notes",
    description: "Chapter 4 summary with worked examples.",
    original_filename: "newtons-laws-notes.pdf",
    mime_type: "application/pdf",
    size_bytes: 245760,
    uploaded_by_id: "usr-teacher-anita",
    uploaded_at: "2026-08-20T10:15:00+05:30",
    is_deleted: false,
  },
  {
    id: "mat-phy10-2",
    class_id: "cls-phy10-anita",
    title: "Motion Practice Problems",
    description: "20 practice problems for the upcoming quiz.",
    original_filename: "motion-practice.pdf",
    mime_type: "application/pdf",
    size_bytes: 512000,
    uploaded_by_id: "usr-teacher-anita",
    uploaded_at: "2026-08-25T14:30:00+05:30",
    is_deleted: false,
  },
  {
    id: "mat-chem10-1",
    class_id: "cls-chem10-anita",
    title: "Periodic Table Reference",
    description: "Printable periodic table with atomic masses.",
    original_filename: "periodic-table.pdf",
    mime_type: "application/pdf",
    size_bytes: 189440,
    uploaded_by_id: "usr-teacher-anita",
    uploaded_at: "2026-08-22T09:00:00+05:30",
    is_deleted: false,
  },
];

export function materialsForClass(classId) {
  return materials.filter((m) => m.class_id === classId && !m.is_deleted);
}

export function findMaterialById(id) {
  return materials.find((m) => m.id === id && !m.is_deleted);
}

export function addMaterial({
  classId,
  title,
  description,
  originalFilename,
  mimeType,
  sizeBytes,
  uploadedById,
}) {
  const material = {
    id: `mat-${Math.random().toString(36).slice(2, 10)}`,
    class_id: classId,
    title,
    description: description || "",
    original_filename: originalFilename,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    uploaded_by_id: uploadedById,
    uploaded_at: new Date().toISOString(),
    is_deleted: false,
  };
  materials.push(material);
  return material;
}

export function softDeleteMaterial(id) {
  const material = materials.find((m) => m.id === id);
  if (!material) return false;
  material.is_deleted = true;
  return true;
}

export function serializeMaterial(material) {
  return {
    id: material.id,
    class_id: material.class_id,
    title: material.title,
    description: material.description,
    original_filename: material.original_filename,
    mime_type: material.mime_type,
    size_bytes: material.size_bytes,
    uploaded_by_id: material.uploaded_by_id,
    uploaded_at: material.uploaded_at,
    download_url: `/api/v1/materials/${material.id}/download/`,
  };
}

// ---------- announcements -------------------------------------------------

let announcements = [
  {
    id: "ann-phy10-1",
    class_id: "cls-phy10-anita",
    title: "Quiz on Newton's Laws — Friday",
    body: "The quiz will cover Chapter 4 (Newton's three laws, free-body diagrams, and friction). Bring a scientific calculator. Duration: 45 minutes.",
    is_pinned: true,
    posted_by_id: "usr-teacher-anita",
    posted_at: "2026-08-26T11:00:00+05:30",
    is_deleted: false,
  },
  {
    id: "ann-phy10-2",
    class_id: "cls-phy10-anita",
    title: "Extra practice session on Saturday",
    body: "Optional problem-solving session this Saturday at 10 AM. We'll go through the practice problems uploaded last week.",
    is_pinned: false,
    posted_by_id: "usr-teacher-anita",
    posted_at: "2026-08-27T09:30:00+05:30",
    is_deleted: false,
  },
  {
    id: "ann-chem10-1",
    class_id: "cls-chem10-anita",
    title: "Lab safety reminder",
    body: "Bring your lab coats for the practical on Monday. No open footwear.",
    is_pinned: false,
    posted_by_id: "usr-teacher-anita",
    posted_at: "2026-08-24T16:00:00+05:30",
    is_deleted: false,
  },
];

export function announcementsForClass(classId) {
  return announcements.filter((a) => a.class_id === classId && !a.is_deleted);
}

export function findAnnouncementById(id) {
  return announcements.find((a) => a.id === id && !a.is_deleted);
}

export function addAnnouncement({
  classId,
  title,
  body,
  isPinned,
  postedById,
}) {
  const announcement = {
    id: `ann-${Math.random().toString(36).slice(2, 10)}`,
    class_id: classId,
    title,
    body,
    is_pinned: !!isPinned,
    posted_by_id: postedById,
    posted_at: new Date().toISOString(),
    is_deleted: false,
  };
  announcements.push(announcement);
  return announcement;
}

export function softDeleteAnnouncement(id) {
  const announcement = announcements.find((a) => a.id === id);
  if (!announcement) return false;
  announcement.is_deleted = true;
  return true;
}

export function serializeAnnouncement(announcement) {
  return {
    id: announcement.id,
    class_id: announcement.class_id,
    title: announcement.title,
    body: announcement.body,
    is_pinned: announcement.is_pinned,
    posted_by_id: announcement.posted_by_id,
    posted_at: announcement.posted_at,
  };
}
