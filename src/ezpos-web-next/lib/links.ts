export function getBackendBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
}

export function getBackendPath(path: string): string {
  const base = getBackendBaseUrl();
  if (!base) return '#';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getProductLinks() {
  const base = getBackendBaseUrl();
  return {
    ezposPricing: getBackendPath('/Home/Pricing'),
    crossxPricing: getBackendPath('/CrossxPos/Pricing'),
    crossxLearnMore: getBackendPath('/CrossxPos/Index'),
    adminLogin: base ? `${base}/Admin/Login` : '/admin',
  };
}
