import type { Metadata } from "next";
import { TranslationsProvider } from "@/components/TranslationsProvider";
import { SUPPORTED_LANGUAGES } from "@/middleware"; 
import Header from "@/components/Header"; 
import Footer from "@/components/Footer"; 
import { ReactNode } from "react";
import './globals.css'; // 确保全局样式在这里导入

// 这个函数现在在根布局中
export async function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((lang) => ({ lang }));
}

export const metadata: Metadata = {
  title: "NEXUS-IMAGE TRANSLATOR",
  description: "AI Powered + Manual Refinement for Perfect Image Translations.",
};

// RootLayout 现在接收 lang 参数
export default function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { lang: string };
}) {
  return (
    // lang 属性直接从 params 中获取
    <html lang={params.lang}>
      <body>
        <TranslationsProvider locale={params.lang}> 
          <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Header /> 
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer /> 
          </div>
        </TranslationsProvider>
      </body>
    </html>)}
