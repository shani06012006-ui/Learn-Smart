// frontend/src/components/layout/PageBackground.jsx


const ADMIN_BG_IMAGE_URL =
  "https://i.pinimg.com/1200x/4d/49/bf/4d49bf8b379dd98a55502aa40db6bbfd.jpg";

const TEACHER_BG_IMAGE_URL =
  "https://i.pinimg.com/1200x/ad/82/b8/ad82b8b19fb4b7dd4fedecbf64616f6b.jpg";  

const STUDENT_BG_IMAGE_URL =
  "https://i.pinimg.com/1200x/cf/cc/ac/cfccac262211bd8fc1675500a5b5d3e5.jpg";  

const DEFAULT_BG_IMAGE_URL = ADMIN_BG_IMAGE_URL;

// 0.10 subtle → 0.60 prominent
export const PAGE_BG_OPACITY = 0.95;

// Soft white gradient over the image so text stays legible
export const PAGE_BG_VEIL = "from-white/55 via-white/35 to-white/65";

/* ================================================================= */

// Map role → image URL. Fall back to the admin image if role unknown.
const ROLE_IMAGE_MAP = {
  admin: ADMIN_BG_IMAGE_URL,
  teacher: TEACHER_BG_IMAGE_URL,
  student: STUDENT_BG_IMAGE_URL,
};

export default function PageBackground({
  role,                          // "admin" | "teacher" | "student" (optional)
  imageUrl,                      // explicit override — wins over `role`
  opacity = PAGE_BG_OPACITY,
  veil = PAGE_BG_VEIL,
}) {
  const resolvedImage =
    imageUrl || (role && ROLE_IMAGE_MAP[role]) || DEFAULT_BG_IMAGE_URL;

  if (!resolvedImage) return null;

  return (
    <>
      {/* Fixed, full-viewport image */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${resolvedImage}')`,
          opacity,
        }}
      />

      {/* Soft veil for contrast */}
      {veil && (
        <div
          aria-hidden="true"
          className={"pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b " + veil}
        />
      )}
    </>
  );
}