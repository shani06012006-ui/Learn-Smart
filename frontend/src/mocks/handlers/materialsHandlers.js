import { http, HttpResponse } from "msw";

import { findUserById } from "../data/users";
import { findClassById, enrollmentsForClass } from "../data/classes";
import {
  addAnnouncement,
  addMaterial,
  announcementsForClass,
  findAnnouncementById,
  findMaterialById,
  materialsForClass,
  serializeAnnouncement,
  serializeMaterial,
  softDeleteAnnouncement,
  softDeleteMaterial,
} from "../data/materials";
import { getBearerToken, userIdForAccessToken } from "../data/session";
import { delay, simpleError, unauthorized, validationError } from "../utils";

const BASE = "/api/v1";

function currentUser(request) {
  const token = getBearerToken(request);
  const userId = token ? userIdForAccessToken(token) : null;
  return userId ? findUserById(userId) : null;
}

// Students can only read materials/announcements for a class where they
// have an ACTIVE enrollment -- mirrors the backend's IsEnrolledStudent
// permission. Teachers can read their own class only.
function hasReadAccess(cls, user) {
  if (!cls || !user) return false;
  if (cls.teacher_id === user.id) return true;
  if (user.role !== "student") return false;
  return enrollmentsForClass(cls.id).some(
    (e) => e.student_id === user.id && e.status === "active"
  );
}

export const materialsHandlers = [
  // GET /classes/:id/materials/
  http.get(`${BASE}/classes/:id/materials/`, ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();

    const cls = findClassById(params.id);
    if (!cls) return simpleError("Not found.", 404);
    if (!hasReadAccess(cls, user)) {
      return simpleError("You do not have access to this class.", 403);
    }

    const list = materialsForClass(cls.id).map(serializeMaterial);
    return HttpResponse.json(list);
  }),

  // POST /classes/:id/materials/
  http.post(`${BASE}/classes/:id/materials/`, async ({ request, params }) => {
        const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "teacher") {
      return simpleError("Only teachers can upload materials.", 403);
    }

    const cls = findClassById(params.id);
    if (!cls) return simpleError("Not found.", 404);
    if (cls.teacher_id !== user.id) {
      return simpleError("You are not the teacher assigned to this class.", 403);
    }

    const formData = await request.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const file = formData.get("file");

    const errors = {};
    if (!title || typeof title !== "string" || !title.trim()) {
      errors.title = ["This field is required."];
    }
    if (!file || typeof file === "string") {
      errors.file = ["A file is required."];
    } else if (file.size > 10 * 1024 * 1024) {
      errors.file = ["File is larger than 10 MB."];
    }
    if (Object.keys(errors).length > 0) return validationError(errors);

    const material = addMaterial({
      classId: cls.id,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      originalFilename: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      uploadedById: user.id,
    });

    return HttpResponse.json(serializeMaterial(material), { status: 201 });
  }),

  // DELETE /materials/:id/
  http.delete(`${BASE}/materials/:id/`, ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "teacher") {
      return simpleError("Only teachers can delete materials.", 403);
    }

    const material = findMaterialById(params.id);
    if (!material) return simpleError("Not found.", 404);

    const cls = findClassById(material.class_id);
    if (!cls || cls.teacher_id !== user.id) {
      return simpleError("You are not the teacher assigned to this class.", 403);
    }

    softDeleteMaterial(material.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---------- announcements -----------------------------------------------

  // GET /classes/:id/announcements/
  http.get(`${BASE}/classes/:id/announcements/`, ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();

    const cls = findClassById(params.id);
    if (!cls) return simpleError("Not found.", 404);
    if (!hasReadAccess(cls, user)) {
      return simpleError("You do not have access to this class.", 403);
    }

    const list = announcementsForClass(cls.id).map(serializeAnnouncement);
    return HttpResponse.json(list);
  }),

  // POST /classes/:id/announcements/ -- teacher-only
  http.post(`${BASE}/classes/:id/announcements/`, async ({ request, params }) => {
        const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "teacher") {
      return simpleError("Only teachers can post announcements.", 403);
    }

    const cls = findClassById(params.id);
    if (!cls) return simpleError("Not found.", 404);
    if (cls.teacher_id !== user.id) {
      return simpleError("You are not the teacher assigned to this class.", 403);
    }

    const body = await request.json();
    const errors = {};
    if (!body.title || !String(body.title).trim()) {
      errors.title = ["This field is required."];
    }
    if (!body.body || !String(body.body).trim()) {
      errors.body = ["This field is required."];
    }
    if (Object.keys(errors).length > 0) return validationError(errors);

    const announcement = addAnnouncement({
      classId: cls.id,
      title: String(body.title).trim(),
      body: String(body.body).trim(),
      isPinned: !!body.is_pinned,
      postedById: user.id,
    });

    return HttpResponse.json(serializeAnnouncement(announcement), { status: 201 });
  }),

  // DELETE /announcements/:id/ -- teacher-only, soft-deletes
  http.delete(`${BASE}/announcements/:id/`, ({ request, params }) => {
    const user = currentUser(request);
    if (!user) return unauthorized();
    if (user.role !== "teacher") {
      return simpleError("Only teachers can delete announcements.", 403);
    }

    const announcement = findAnnouncementById(params.id);
    if (!announcement) return simpleError("Not found.", 404);

    const cls = findClassById(announcement.class_id);
    if (!cls || cls.teacher_id !== user.id) {
      return simpleError("You are not the teacher assigned to this class.", 403);
    }

    softDeleteAnnouncement(announcement.id);
    return new HttpResponse(null, { status: 204 });
  }),
];

