// Google Analytics utility functions
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
    });
  }
};

// Track custom events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track link clicks
export const trackLinkClick = (linkName: string, url: string) => {
  event({
    action: 'click',
    category: 'engagement',
    label: `${linkName} - ${url}`,
  });
};

// Track data refresh
export const trackDataRefresh = (dataType: string) => {
  event({
    action: 'data_refresh',
    category: 'api',
    label: dataType,
  });
};

// Track errors
export const trackError = (errorType: string, errorMessage: string) => {
  event({
    action: 'error',
    category: 'technical',
    label: `${errorType}: ${errorMessage}`,
  });
};