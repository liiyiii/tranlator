'use client';

import * as React from 'react';
import i18n, { TFunction, i18n as I18nType } from 'i18next';
import { initReactI18next } from 'react-i18next';
// **【关键修改】从 middleware 导入常量**
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../middleware';

interface I18nContextValue {
  t: TFunction<'translation', undefined>;
  i18n: I18nType;
  ready: boolean;
}

const defaultI18nValue: I18nContextValue = {
  t: ((key: string) => key) as TFunction<'translation', undefined>,
  i18n: i18n,
  ready: false
};

const I18nContext = React.createContext<I18nContextValue>(defaultI18nValue);

// **【关键修改】删除此处的常量定义**

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          navHome: "Home",
          navTool: "Translator Tool",
          navPricing: "Pricing",
          navFAQ: "FAQ",
          navAbout: "About Us",
          footerRights: "All rights reserved.",
          homeTitle: "NEXUS-IMAGE TRANSLATOR",
          homeSubtitle: "AI Powered + Manual Refinement for Perfect Image Translations.",
          homeCTA: "Try the Tool",
          aboutTitle: "About NEXUS-IMAGE TRANSLATOR",
          aboutText: "We are dedicated to providing the best image translation experience...",
          pricingTitle: "Our Pricing Plans",
          pricingFree: "Free Tier",
          pricingPro: "Pro Tier",
          faqTitle: "Frequently Asked Questions",
          faqQ1: "What is this tool?",
          faqA1: "This tool helps you translate text within images."
        }
      },
      zh: {
        translation: {
          navHome: "首页",
          navTool: "翻译工具",
          navPricing: "价格",
          navFAQ: "常见问题",
          navAbout: "关于我们",
          footerRights: "版权所有。",
          homeTitle: "NEXUS-IMAGE 翻译器",
          homeSubtitle: "AI驱动 + 人工精修，实现完美图片翻译。",
          homeCTA: "试用工具",
          aboutTitle: "关于 NEXUS-IMAGE 翻译器",
          aboutText: "我们致力于提供最佳的图片翻译体验...",
          pricingTitle: "我们的价格计划",
          pricingFree: "免费版",
          pricingPro: "专业版",
          faqTitle: "常见问题解答",
          faqQ1: "这是什么工具？",
          faqA1: "本工具帮助您翻译图片内的文字。"
        }
      }
    },
    // **【关键修改】使用导入的常量**
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES, // 明确告知 i18next 支持的语言
    interpolation: {
      escapeValue: false
    }
  });

export function useI18n() {
  const context = React.useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const handleInitialized = () => setReady(true);
    i18n.on('initialized', handleInitialized);
    
    return () => {
      i18n.off('initialized', handleInitialized);
    };
  }, []);

  const value = {
    t: i18n.t,
    i18n,
    ready
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export default i18n;
