import { SOCIAL } from "@/lib/refs";

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" />
    </svg>
  );
}

const ICON = { instagram: InstagramIcon, youtube: YouTubeIcon } as const;

export default function SocialLinks({ className = "" }: { className?: string }) {
  if (SOCIAL.length === 0) return null;
  return (
    <ul className={`flex items-center gap-2 ${className}`}>
      {SOCIAL.map((s) => {
        const Icon = ICON[s.key as keyof typeof ICON];
        return (
          <li key={s.key}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              title={s.label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              <Icon />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
