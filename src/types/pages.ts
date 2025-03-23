import { LucideIcon } from "lucide-react";
import { Home, Trophy, Info } from "lucide-react";

export interface Page {
  title: string;
  path: string;
  icon: LucideIcon;
}

export const APP_PAGES: Page[] = [
  {
    title: "Personal Mining",
    path: "/",
    icon: Home,
  },
  {
    title: "Global Leaderboard",
    path: "/leaderboard",
    icon: Trophy,
  },
  {
    title: "About",
    path: "/about",
    icon: Info,
  },
];

export function getPageTitle(pathname: string): string {
  const page = APP_PAGES.find((page) => page.path === pathname);
  return page?.title ?? "Personal Mining";
} 