import { NextResponse, type NextRequest } from 'next/server';

// Optimistic gate only: pages and actions re-check the session against the database.
export function proxy(request: NextRequest) {
  if (request.cookies.has('session')) return NextResponse.next();
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/invoices/:path*', '/settings/:path*', '/admin/:path*'],
};
