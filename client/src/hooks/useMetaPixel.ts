/**
 * useMetaPixel — Meta Pixel 1660493731124134
 * Só inicializa após consentimento LGPD (localStorage: metrika-cookie-consent = 'accepted')
 */

const PIXEL_ID = '1660493731124134';
const CONSENT_KEY = 'metrika-cookie-consent';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

function injectPixelScript() {
  if (document.getElementById('fb-pixel-script')) return; // já injetado

  // Script base do Meta Pixel
  const script = document.createElement('script');
  script.id = 'fb-pixel-script';
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${PIXEL_ID}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  // Noscript fallback
  const noscript = document.createElement('noscript');
  noscript.id = 'fb-pixel-noscript';
  const img = document.createElement('img');
  img.height = 1;
  img.width = 1;
  img.style.display = 'none';
  img.src = `https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`;
  noscript.appendChild(img);
  document.head.appendChild(noscript);
}

export function initPixelIfConsented() {
  if (localStorage.getItem(CONSENT_KEY) === 'accepted') {
    injectPixelScript();
  }
}

export function acceptAndInitPixel() {
  localStorage.setItem(CONSENT_KEY, 'accepted');
  injectPixelScript();
}

export function declinePixel() {
  localStorage.setItem(CONSENT_KEY, 'declined');
}

export function trackEvent(event: string, params?: Record<string, any>) {
  if (typeof window.fbq === 'function') {
    window.fbq('track', event, params);
  }
}

/** Chama ViewContent — use na landing page */
export function trackViewContent(contentName: string) {
  trackEvent('ViewContent', { content_name: contentName });
}

/** Chama Lead — use quando visitante clica em "Experimente grátis" / "Assinar" */
export function trackLead(params?: Record<string, any>) {
  trackEvent('Lead', params);
}

/** Chama InitiateCheckout — use ao redirecionar pro checkout */
export function trackInitiateCheckout(params?: Record<string, any>) {
  trackEvent('InitiateCheckout', params);
}

export function hasConsent(): boolean {
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}

export function hasAnswered(): boolean {
  return localStorage.getItem(CONSENT_KEY) !== null;
}
