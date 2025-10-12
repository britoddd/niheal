import { NextResponse, type NextRequest } from 'next/server'

async function checkBackendAuth(request: NextRequest): Promise<boolean> {
  try {
    // Get the session cookie from the request
    const cookie = request.headers.get('cookie')
    
    // Make a request to your backend to check authentication
    const response = await fetch('http://localhost:4000/api/user', {
      headers: {
        'Cookie': cookie || '',
      },
      credentials: 'include',
    })
    
    return response.ok
  } catch (error) {
    console.error('Auth check failed:', error)
    return false
  }
}

export async function updateSession(request: NextRequest) {
  // Check if user is authenticated by calling your Express backend
  const isAuthenticated = await checkBackendAuth(request)

  if (
    !isAuthenticated &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/register') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/error') &&
    request.nextUrl.pathname !== '/'
  ) {
    // no user, redirect to login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next({
    request,
  })
}