import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Tracky AI` : 'Tracky AI — Build better days';
  }, [title]);
}
