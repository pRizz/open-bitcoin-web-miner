import { LucideIcon, Home, Trophy, Info } from "lucide-react";

type BaseRoute = {
  title: string;
  routerPath: string;
  icon: LucideIcon;
};

type StaticRoute = BaseRoute & {
  type: 'static';
  path: string;
};

type DynamicRoute = BaseRoute & {
  type: 'dynamic';
  path: (params: Record<string, string>) => string;
  paramName: string;
};

type Route = StaticRoute | DynamicRoute;

export const routes: Record<string, Route> = {
  home: {
    type: 'static' as const,
    path: '/',
    routerPath: '/',
    title: 'Personal Mining',
    icon: Home,
  },
  leaderboard: {
    type: 'static' as const,
    path: '/leaderboard',
    routerPath: '/leaderboard',
    title: 'Global Leaderboard',
    icon: Trophy,
  },
  submission: {
    type: 'dynamic' as const,
    path: (params: { hash: string }) => `/submission/${params.hash}`,
    routerPath: '/submission/:hash',
    title: 'Submission',
    paramName: 'hash' as const,
    icon: Info,
  },
  about: {
    type: 'static' as const,
    path: '/about',
    routerPath: '/about',
    title: 'About',
    icon: Info,
  },
  proofOfReward: {
    type: 'static' as const,
    path: '/proof-of-reward',
    routerPath: '/proof-of-reward',
    title: 'Proof of Reward',
    icon: Info,
  },
} as const;

export type RouteName = keyof typeof routes;
export type RouteConfig = typeof routes[RouteName];

// Type guard to check if a route is dynamic
export function isDynamicRoute(route: RouteConfig): route is Extract<RouteConfig, { type: 'dynamic' }> {
  return route.type === 'dynamic';
}

// Type guard to check if a route is static
export function isStaticRoute(route: RouteConfig): route is Extract<RouteConfig, { type: 'static' }> {
  return route.type === 'static';
}

export function getPageTitle(pathname: string): string {
  const route = Object.values(routes).find((route) => route.path === pathname);
  return route?.title ?? "Personal Mining";
}

// Define which routes should appear in the sidebar
export const sidebarPages = [
  routes.home,
  routes.leaderboard,
  routes.about,
].filter(isStaticRoute);
