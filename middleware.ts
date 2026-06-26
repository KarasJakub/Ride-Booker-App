import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get('refreshToken')
  const isAuthenticated = !!refreshToken?.value

  const { pathname } = request.nextUrl

  const isLoginPage = pathname === '/login'
  const isRegisterPage = pathname === '/register'
  const isAdminLoginPage = pathname === '/admin/login'
  const isAdminRoute = pathname.startsWith('/admin') && !isAdminLoginPage
  const isUserRoute = pathname.startsWith('/user')
  const isForgotPasswordPage = pathname === '/forgot-password'
  const isResetPasswordPage = pathname === '/reset-password'
  const isDemoPage = pathname === '/demo'
  const isHomePage = pathname === '/'

  if (isDemoPage || isHomePage) {
    return NextResponse.next()
  }

  if ((isAdminRoute || isUserRoute) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

    if (isUserRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if ((isLoginPage || isRegisterPage || isForgotPasswordPage || isResetPasswordPage) && isAuthenticated) {
    return NextResponse.redirect(new URL('/user/dashboard', request.url))
  }

  if (isAdminLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }
}

export const config = {
  matcher: ['/admin/:path*', '/user/:path*', '/login', '/register', '/forgot-password', '/reset-password'],
}