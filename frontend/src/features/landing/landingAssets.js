// frontend/src/features/landing/landingAssets.js
//
// All landing-page images live here so you can swap them in one place.
// Tip: download your own photos into  frontend/public/landing/  and point to
// them like  "/landing/hero.jpg"  — hot-linked URLs (Pinterest etc.) can break
// at any time. Every <SafeImage> falls back to a clean placeholder if a URL fails.

export const IMAGES = {
  hero: "https://i.pinimg.com/1200x/0c/60/5f/0c605f5725146674637fe3342783ecf4.jpg",
  teacher: "https://i.pravatar.cc/640?img=47",
  expert: "https://i.pravatar.cc/640?img=12",
};

export const AVATARS = [5, 11, 32, 47].map((n) => `https://i.pravatar.cc/96?img=${n}`);