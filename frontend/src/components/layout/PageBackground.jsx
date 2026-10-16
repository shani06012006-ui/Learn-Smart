// frontend/src/components/layout/PageBackground.jsx
import { getRoleConfig } from "../../config/roleConfig";

export default function PageBackground({
  role,
  imageUrl,
  opacity,
  veil,
}) {
  const R = getRoleConfig(role);

  const resolvedImage = imageUrl || R.background.imageUrl;
  const resolvedOpacity = opacity ?? R.background.opacity;
  const resolvedVeil = veil ?? R.background.veil;

  if (!resolvedImage) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${resolvedImage}')`,
          opacity: resolvedOpacity,
        }}
      />
      {resolvedVeil && (
        <div
          aria-hidden="true"
          className={
            "pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b " +
            resolvedVeil
          }
        />
      )}
    </>
  );
}