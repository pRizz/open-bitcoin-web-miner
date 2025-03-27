import { Link, LinkProps } from 'react-router-dom'
import { routes, RouteName, isDynamicRoute } from '../routes'

type TypedLinkProps<K extends RouteName> = {
  route: K
  params?: K extends 'submission' ? { hash: string } : never
} & Omit<LinkProps, 'to'>

export function TypedLink<K extends RouteName>({
  route,
  params,
  ...rest
}: TypedLinkProps<K>) {
  const routeConfig = routes[route]
  const to = isDynamicRoute(routeConfig)
    ? routeConfig.path(params as any)
    : routeConfig.path

  return <Link to={to} {...rest} />
}