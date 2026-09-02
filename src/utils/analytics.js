export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window === 'undefined') return;

  if (process.env.NODE_ENV === 'production' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  } else {
    console.log(`[Analytics Event] ${eventName}`, eventParams);
  }
};
