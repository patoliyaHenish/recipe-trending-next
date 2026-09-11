export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window === 'undefined') return;

  if (process.env.NODE_ENV === 'production' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  } else {
    console.log(`[Analytics Event] ${eventName}`, eventParams);
  }
};

export const trackLandingPage = (page, page_title) => {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem('landing_page_tracked')) return;

  sessionStorage.setItem('landing_page_tracked', 'true');
  trackEvent('landing_page', { page, page_title });
};

export const clearLandingPageSession = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('landing_page_tracked');
};
