import { useEffect, useState } from 'react';
import { BREAKPOINTS } from '../../lib/constants';

type ViewportBand = 'mobile' | 'tablet' | 'desktop';

function getViewportBand(): ViewportBand {
  if (window.innerWidth < BREAKPOINTS.MOBILE) {
    return 'mobile';
  }

  if (window.innerWidth < BREAKPOINTS.TABLET) {
    return 'tablet';
  }

  return 'desktop';
}

export function useViewportBand(): ViewportBand {
  const [band, setBand] = useState<ViewportBand>(() => getViewportBand());

  useEffect(() => {
    const onResize = () => {
      setBand(getViewportBand());
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return band;
}
