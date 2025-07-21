// image-translator-new/src/app/[lang]/layout.tsx
import type { Metadata } from "next";

import { TranslationsProvider } from "@/components/TranslationsProvider";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n"; 

import Header from "@/components/Header"; 
import Footer from "@/components/Footer"; 

export async function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((lang) => ({ lang }));
}

export const metadata: Metadata = {
  title: "NEXUS-IMAGE TRANSLATOR",
  description: "AI Powered + Manual Refinement for Perfect Image Translations.",
};

export default function LangLayout({
  children,
  params: { lang },
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string }; 
}>) {
  return (
    <TranslationsProvider locale={lang as string}> 
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header /> 
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer /> 
      </div>
    </TranslationsProvider>
  );
}