import { formatDateLabel, isDifferentDay } from "../../../utils/formatters";

export function shouldShowDivider(currentIso, previousIso) {
  return isDifferentDay(currentIso, previousIso);
}

export default function DateDivider({ iso }) {
  return (
    <div className="my-3 flex items-center justify-center">
      <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-ink-500 shadow-sm">
        {formatDateLabel(iso)}
      </span>
    </div>
  );
}
