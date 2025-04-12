import { LucideIcon, Home, Trophy, Info, BarChart } from "lucide-react";

type BaseRoute = {
  title: string;
  routerPath: string;
  icon: LucideIcon;
  keyName: string;
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

// type Route = StaticRoute | DynamicRoute;

export const routes = {
  home: {
    type: 'static' as const,
    path: '/',
    routerPath: '/',
    title: 'WinABitco.in',
    icon: Home,
    keyName: 'home',
  },
  leaderboard: {
    type: 'static' as const,
    path: '/leaderboard',
    routerPath: '/leaderboard',
    title: 'Global Leaderboard',
    icon: Trophy,
    keyName: 'leaderboard',
  },
  submission: {
    type: 'dynamic' as const,
    path: (params: { hash: string }) => `/submission/${params.hash}`,
    routerPath: '/submission/:hash',
    title: 'Submission',
    paramName: 'hash' as const,
    icon: Info,
    keyName: 'submission',
  },
  about: {
    type: 'static' as const,
    path: '/about',
    routerPath: '/about',
    title: 'About',
    icon: Info,
    keyName: 'about',
  },
  proofOfReward: {
    type: 'static' as const,
    path: '/proof-of-reward',
    routerPath: '/proof-of-reward',
    title: 'Proof of Reward',
    icon: Info,
    keyName: 'proofOfReward',
  },
  miningStatistics: {
    type: 'static' as const,
    path: '/mining-statistics',
    routerPath: '/mining-statistics',
    title: 'Mining Statistics',
    icon: BarChart,
    keyName: 'miningStatistics',
  },
} as const;

export type RouteName = keyof typeof routes;
export type RouteConfig = typeof routes[RouteName];

export function getRoute(key: RouteName): typeof routes[RouteName] {
  return routes[key];
}

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
  return route?.title ?? "WinABitco.in";
}

// Define which routes should appear in the sidebar
export const sidebarPages = [
  routes.home,
  routes.leaderboard,
  routes.miningStatistics,
  routes.about,
].filter(isStaticRoute);
