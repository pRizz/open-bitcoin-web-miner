import { useNavigate } from 'react-router-dom';
import { routes, RouteName, isDynamicRoute } from '../routes';

export const useTypedNavigate = () => {
  const navigate = useNavigate();

  return {
    to: <T extends RouteName>(
      routeName: T,
      ...args: Record<string, string>[]
    ) => {
      const route = routes[routeName];

      if (isDynamicRoute(route)) {
        const paramName = route.paramName;
        // TODO: Type this properly.
        navigate(route.path({ [paramName]: args[paramName] }));
      } else {
        navigate(route.path);
      }
    },
  };
};
