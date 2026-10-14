// frontend/src/components/layout/PageBackground.jsx

/* =================================================================
   >>> SHARED BACKGROUND FOR THE ENTIRE ADMIN AREA <<<
   -----------------------------------------------------------------
   Paste one DIRECT image URL. Applies to every admin page.
   Reliable hosts: i.ibb.co, i.imgur.com, raw.githubusercontent.com,
                   images.unsplash.com, picsum.photos
   Blocked hosts:  i.pinimg.com (Pinterest) often 403s hotlinks
   ================================================================= */
export const PAGE_BG_IMAGE_URL =
  "https://i.pinimg.com/1200x/4d/49/bf/4d49bf8b379dd98a55502aa40db6bbfd.jpg";

// 0.10 subtle → 0.60 prominent
export const PAGE_BG_OPACITY = 0.35;

// Soft white gradient over the image so text stays legible
export const PAGE_BG_VEIL = "from-white/55 via-white/35 to-white/65";

/* ================================================================= */

export default function PageBackground({
  imageUrl = PAGE_BG_IMAGE_URL,
  opacity = PAGE_BG_OPACITY,
  veil = PAGE_BG_VEIL,
}) {
  if (!imageUrl) return null;

  return (
    <>
      {/* Fixed, full-viewport image */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${imageUrl}')`,
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