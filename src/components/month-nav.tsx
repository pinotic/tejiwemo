import Link from "next/link";
import { currentMonth, monthLabel, shiftMonth } from "@/lib/finance";

export default function MonthNav({ basePath, month }: { basePath: string; month: string }) {
  const cur = currentMonth();
  const isCurrent = month >= cur;
  const link = (m: string) => (m === cur ? basePath : `${basePath}?bulan=${m}`);
  const btn = "flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 hover:bg-stone-100";
  return (
    <div className="flex items-center gap-2">
      <Link href={link(shiftMonth(month, -1))} className={btn} aria-label="Bulan sebelumnya">‹</Link>
      <span className="min-w-[8.5rem] text-center text-sm font-medium">{monthLabel(month)}</span>
      {isCurrent ? (
        <span className={`${btn} pointer-events-none opacity-40`} aria-hidden>›</span>
      ) : (
        <Link href={link(shiftMonth(month, 1))} className={btn} aria-label="Bulan berikutnya">›</Link>
      )}
    </div>
  );
}
