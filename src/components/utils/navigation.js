/**
 * Return to the previous in-app page when one exists. When a page was opened
 * directly, send the user to a useful parent route instead of leaving the app.
 */
export function safeGoBack(navigate) {
  const historyIndex = window.history.state?.idx;

  if (Number.isInteger(historyIndex) && historyIndex > 0) {
    navigate(-1);
    return;
  }

  const pathname = window.location.pathname;
  let fallback = '/home';

  if (pathname === '/cart') {
    fallback = '/marketplace';
  } else if (pathname === '/bank-services') {
    fallback = '/home';
  } else if (pathname === '/marketplace') {
    fallback = '/home';
  } else if (pathname.startsWith('/marketplace/products/oziqovqat/')) {
    fallback = '/marketplace/products/oziqovqat';
  } else if (pathname.startsWith('/marketplace/products/')) {
    fallback = '/marketplace/products';
  } else if (pathname.startsWith('/marketplace/services/')) {
    fallback = '/marketplace/services';
  } else if (pathname.startsWith('/marketplace')) {
    fallback = '/marketplace';
  } else if (
    pathname.startsWith('/services/') ||
    pathname.startsWith('/service-provider/')
  ) {
    fallback = '/marketplace/services';
  } else if (pathname.startsWith('/equipment/')) {
    fallback = '/marketplace/products';
  } else if (pathname.startsWith('/location/')) {
    fallback = '/marketplace/locations';
  } else if (pathname.startsWith('/provider-requests/')) {
    fallback = '/provider-requests';
  } else if (pathname.startsWith('/subcategory/')) {
    const [, , level1] = pathname.split('/');
    fallback = level1 ? `/category/${level1}` : '/business-directions';
  } else if (pathname.startsWith('/category/')) {
    fallback = '/business-directions';
  } else if (pathname === '/business-directions') {
    fallback = '/marketplace';
  } else if (pathname.startsWith('/edit/')) {
    fallback = '/profile';
  } else if (['/add-equipment', '/add-service', '/add-location'].includes(pathname)) {
    fallback = '/add-listing';
  } else if (pathname === '/add-listing') {
    fallback = '/profile';
  }

  navigate(fallback, { replace: true });
}
