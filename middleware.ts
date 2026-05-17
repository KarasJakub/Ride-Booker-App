import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get('refreshToken')
  const isAuthenticated = !!refreshToken?.value

  const isLoginPage = request.nextUrl.pathname.startsWith('/login')
  const isRegisterPage = request.nextUrl.pathname.startsWith('/register')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isUserRoute = request.nextUrl.pathname.startsWith('/user')

  if ((isAdminRoute || isUserRoute) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if ((isLoginPage || isRegisterPage) && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }
}

export const config = {
  matcher: ['/admin/:path*', '/user/:path*', '/login', '/register'],
}