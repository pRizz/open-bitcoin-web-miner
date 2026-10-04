import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageMetadata } from '@/lib/pageMetadata';

/** Keep SPA navigation metadata tied to the displayed route. */
export function PageMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const { title, url } = pageMetadata(pathname);
    document.title = title;

    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?? document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = url;
    if (!canonical.parentNode) document.head.appendChild(canonical);

    document.querySelector('meta[property="og:url"]')?.setAttribute('content', url);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
  }, [pathname]);

  return null;
}
