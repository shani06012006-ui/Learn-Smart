import clsx from "clsx";

const SIZES = { sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-10 w-10 border-[3px]" };

export default function Spinner({ size = "md", className }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={clsx(
        "inline-block animate-spin rounded-full border-brand-200 border-t-brand-600",
        SIZES[size],
        className
      )}
    />
  );
}
