import { NextRequest, NextResponse } from 'next/server';

// 基础常量在这里定义和导出
export const SUPPORTED_LANGUAGES = ['en', 'zh'];
export const DEFAULT_LANGUAGE = 'en';

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过公共文件、_next 路径和 API 路由
  if (
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  const pathnameIsMissingLocale = SUPPORTED_LANGUAGES.every(
    (lang) => !pathname.startsWith(`/${lang}/`) && pathname !== `/${lang}`
  );

  if (pathnameIsMissingLocale) {
    const locale = DEFAULT_LANGUAGE;
    const newPathname = `/${locale}${pathname === '/' ? '' : pathname}`;

    return NextResponse.rewrite(
      new URL(newPathname, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)',
  ],
};
