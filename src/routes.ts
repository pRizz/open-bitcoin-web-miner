import { LucideIcon, Home, Trophy, Info, BarChart, Zap, Bell, Cpu } from "lucide-react";

type BaseRoute = {
  sidebarTitle: string;
  topBarTitle: string;
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
    sidebarTitle: 'Win3Bitco.in',
    topBarTitle: 'Win3Bitco.in',
    icon: Home,
    keyName: 'home',
  },
  simpleMining: {
    type: 'static' as const,
    path: '/simple-mining',
    routerPath: '/simple-mining',
    sidebarTitle: 'Simple Mode',
    topBarTitle: 'Win3Bitco.in',
    icon: Zap,
    keyName: 'simpleMining',
  },
  leaderboard: {
    type: 'static' as const,
    path: '/leaderboard',
    routerPath: '/leaderboard',
    sidebarTitle: 'Global Leaderboard',
    topBarTitle: 'Global Leaderboard',
    icon: Trophy,
    keyName: 'leaderboard',
  },
  notifications: {
    type: 'static' as const,
    path: '/notifications',
    routerPath: '/notifications',
    sidebarTitle: 'Notifications',
    topBarTitle: 'Notifications',
    icon: Bell,
    keyName: 'notifications',
  },
  submission: {
    type: 'dynamic' as const,
    path: (params: { hash: string }) => `/submission/${params.hash}`,
    routerPath: '/submission/:hash',
    sidebarTitle: 'Submission',
    topBarTitle: 'Submission',
    paramName: 'hash' as const,
    icon: Info,
    keyName: 'submission',
  },
  hashDetails: {
    type: 'dynamic' as const,
    path: (params: { hash: string }) => `/hash-details/${params.hash}`,
    routerPath: '/hash-details/:hash',
    sidebarTitle: 'Hash Details',
    topBarTitle: 'Hash Details',
    paramName: 'hash' as const,
    icon: Info,
    keyName: 'hashDetails',
  },
  about: {
    type: 'static' as const,
    path: '/about',
    routerPath: '/about',
    sidebarTitle: 'About',
    topBarTitle: 'About',
    icon: Info,
    keyName: 'about',
  },
  proofOfReward: {
    type: 'static' as const,
    path: '/proof-of-reward',
    routerPath: '/proof-of-reward',
    sidebarTitle: 'Proof of Reward',
    topBarTitle: 'Proof of Reward',
    icon: Info,
    keyName: 'proofOfReward',
  },
  miningStatistics: {
    type: 'static' as const,
    path: '/mining-statistics',
    routerPath: '/mining-statistics',
    sidebarTitle: 'Mining Statistics',
    topBarTitle: 'Mining Statistics',
    icon: BarChart,
    keyName: 'miningStatistics',
  },
  homeBitcoinMining: {
    type: 'static' as const,
    path: '/home-bitcoin-mining',
    routerPath: '/home-bitcoin-mining',
    sidebarTitle: 'Mining Viability',
    topBarTitle: 'Mining Viability',
    icon: Cpu,
    keyName: 'homeBitcoinMining',
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
  return route?.topBarTitle ?? "Win3Bitco.in";
}

// Define which routes should appear in the sidebar
export const sidebarPages = [
  routes.home,
  routes.simpleMining,
  routes.leaderboard,
  routes.notifications,
  routes.miningStatistics,
  routes.homeBitcoinMining,
  routes.about,
].filter(isStaticRoute);
