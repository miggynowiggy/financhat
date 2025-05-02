import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuthenticated = !!token

  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Paths that don't require authentication
  const publicPaths = ["/login", "/api/auth"]
  const isPublicPath = publicPaths.some((publicPath) => path.startsWith(publicPath))

  // If the path is public, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }

  // If the user is not authenticated and the path is not public, redirect to login
  if (!isAuthenticated) {
    const url = new URL("/login", request.url)
    return NextResponse.redirect(url)
  }

  // If the user is authenticated and trying to access login, redirect to home
  if (isAuthenticated && path === "/login") {
    const url = new URL("/", request.url)
    return NextResponse.redirect(url)
  }

  // Otherwise, allow access
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
}
