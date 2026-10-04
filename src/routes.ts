import { productionSite } from './config/production';
import { publicRoutePaths } from './config/publicRoutes';
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
    path: publicRoutePaths.home,
    routerPath: publicRoutePaths.home,
    sidebarTitle: productionSite.brand,
    topBarTitle: productionSite.brand,
    icon: Home,
    keyName: 'home',
  },
  simpleMining: {
    type: 'static' as const,
    path: publicRoutePaths.simpleMining,
    routerPath: publicRoutePaths.simpleMining,
    sidebarTitle: 'Simple Mode',
    topBarTitle: productionSite.brand,
    icon: Zap,
    keyName: 'simpleMining',
  },
  leaderboard: {
    type: 'static' as const,
    path: publicRoutePaths.leaderboard,
    routerPath: publicRoutePaths.leaderboard,
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
    path: publicRoutePaths.about,
    routerPath: publicRoutePaths.about,
    sidebarTitle: 'About',
    topBarTitle: 'About',
    icon: Info,
    keyName: 'about',
  },
  proofOfReward: {
    type: 'static' as const,
    path: publicRoutePaths.proofOfReward,
    routerPath: publicRoutePaths.proofOfReward,
    sidebarTitle: 'Proof of Reward',
    topBarTitle: 'Proof of Reward',
    icon: Info,
    keyName: 'proofOfReward',
  },
  miningStatistics: {
    type: 'static' as const,
    path: publicRoutePaths.miningStatistics,
    routerPath: publicRoutePaths.miningStatistics,
    sidebarTitle: 'Mining Statistics',
    topBarTitle: 'Mining Statistics',
    icon: BarChart,
    keyName: 'miningStatistics',
  },
  homeBitcoinMining: {
    type: 'static' as const,
    path: publicRoutePaths.homeBitcoinMining,
    routerPath: publicRoutePaths.homeBitcoinMining,
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
  const maybeRoute = Object.values(routes).find((route) => {
    if (route.type === 'static') return route.path === pathname;
    const prefix = route.routerPath.split('/:')[0];
    return pathname.startsWith(`${prefix}/`) && pathname.slice(prefix.length + 1).length > 0;
  });
  return maybeRoute?.topBarTitle ?? productionSite.brand;
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
