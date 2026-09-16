import Spinner from "../ui/Spinner";

export default function LoadingState({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-500">
      <Spinner size="lg" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
