'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useParams, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@/middleware';
import { useState, useEffect, useMemo } from 'react';

export default function Header() {
  const { t } = useTranslation();
  const params = useParams();
  const pathname = usePathname();
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 使用 useMemo 来缓存计算结果，避免不必要的重复计算
  const currentLang = useMemo(() => {
    return (params.lang as string) || DEFAULT_LANGUAGE;
  }, [params.lang]);

  const getLocalizedPath = (targetLang: string) => {
    if (!pathname) return `/${targetLang}`;
    
    const currentPathname = pathname.startsWith(`/${currentLang}`) 
      ? pathname.substring(`/${currentLang}`.length) 
      : pathname;
    
    // 确保返回的路径总是以 / 开头，并且处理根路径
    const finalPath = currentPathname === '' ? '/' : currentPathname;
    return `/${targetLang}${finalPath === '/' && targetLang !== DEFAULT_LANGUAGE ? '' : finalPath}`;
  };
  
  const getHomeAnchorLink = (hash: string) => {
    const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;
    return `/${currentLang}/#${cleanHash}`;
  };

  return (
    <header className="bg-gray-800 shadow-md sticky top-0 z-50 text-foreground">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link href={`/${currentLang}/`} className="text-2xl font-bold text-brand-purple hover:text-brand-blue transition-colors">
          NEXUS-IT
        </Link>
        <nav className="space-x-2 sm:space-x-4 flex items-center text-sm sm:text-base">
          {/* **【关键修改】** */}
          {/* 现在，我们将所有动态链接和语言切换器都包裹在 isClient 条件中 */}
          {isClient ? (
            <>
              {/* 导航链接 */}
              <Link href={`/${currentLang}/`} className="hover:text-brand-blue transition-colors">{t('navHome')}</Link>
              <Link href={`/${currentLang}/tool`} className="hover:text-brand-blue transition-colors">{t('navTool')}</Link>
              <Link href={getHomeAnchorLink('pricing')} className="hover:text-brand-blue transition-colors">{t('navPricing')}</Link>
              <Link href={getHomeAnchorLink('faq')} className="hover:text-brand-blue transition-colors">{t('navFAQ')}</Link>
              <Link href={getHomeAnchorLink('about')} className="hover:text-brand-blue transition-colors">{t('navAbout')}</Link>
              
              {/* 语言切换器 */}
              <div className="relative group">
                <button className="flex items-center p-1 sm:p-2 rounded-md hover:bg-gray-700 transition-colors">
                  <Globe size={20} className="mr-1" /> 
                  <span className="hidden sm:inline">{currentLang.toUpperCase()}</span>
                </button>
                <div className="absolute right-0 mt-1 w-32 bg-gray-700 border border-gray-600 rounded-md shadow-lg py-1 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out invisible group-hover:visible z-20">
                  {SUPPORTED_LANGUAGES.map((lang: string) => (
                    currentLang !== lang && (
                      <Link
                        key={lang}
                        href={getLocalizedPath(lang)}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-600"
                      >
                        {lang === 'en' ? 'English (EN)' : '中文 (ZH)'}
                      </Link>
                    )
                  ))}
                </div>
              </div>
            </>
          ) : (
            // **【关键修改】**
            // 服务器端和初始渲染时的占位符，现在它代表了整个导航区域
            <div className="flex items-center space-x-4">
              <div className="h-5 w-16 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-5 w-16 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-5 w-20 bg-gray-700 rounded animate-pulse"></div>
              <div className="flex items-center p-1 sm:p-2 rounded-md">
                <Globe size={20} className="text-gray-500" />
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}