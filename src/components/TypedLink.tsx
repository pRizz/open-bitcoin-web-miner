import React from "react";
import { Link, LinkProps } from 'react-router-dom'
import { routes, RouteName, isDynamicRoute } from '../routes'

type HashRouteParams = { hash: string }

type TypedLinkProps<K extends RouteName> = {
  routeKeyName: K
  params?: K extends 'submission' | 'hashDetails' ? HashRouteParams : never
} & Omit<LinkProps, 'to'>

export function TypedLink<K extends RouteName>({
  routeKeyName,
  params,
  ...rest
}: TypedLinkProps<K>) {
  const routeConfig = routes[routeKeyName]
  const to = isDynamicRoute(routeConfig)
    ? routeConfig.path(params as HashRouteParams)
    : routeConfig.path

  return <Link to={to} {...rest} />
}
