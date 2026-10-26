import { AppleIcon, PlayStoreIcon } from "@/components/icons";
import type { Project, ProjectsPageCopy } from "@/content";

export function StoreBadges({ links, copy }: { links: Project["storeLinks"]; copy: ProjectsPageCopy["caseStudy"] }) {
  if (!links.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {links.map((link) => {
        const label = link.store === "play" ? "Google Play" : "App Store";
        const Icon = link.store === "play" ? PlayStoreIcon : AppleIcon;
        const body = (
          <>
            <Icon size={18} />
            <span className="leading-tight">
              <span className="block text-[0.62rem] uppercase opacity-70">
                {link.app ?? (link.href ? (link.store === "play" ? copy.storePlay : copy.storeApp) : copy.storeComingSoon)}
              </span>
              <span className="block text-sm font-semibold">{label}</span>
            </span>
          </>
        );
        const className = "inline-flex items-center gap-2 rounded-md border border-border bg-text px-3.5 py-2 text-bg";
        return (
          <li key={`${link.store}-${link.app ?? ""}`}>
            {link.href ? (
              <a href={link.href} target="_blank" rel="noopener noreferrer" className={`${className} transition-transform hover:-translate-y-0.5`}>
                {body}
              </a>
            ) : (
              <span className={`${className} opacity-80`}>{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
