// **【关键修改】整个文件内容替换为以下代码**

import i18n from "./i18n"; 
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "../middleware"; 

// 从 i18n 实例中动态推断出字典的类型
// 这样可以确保类型安全，并且与您的翻译资源保持同步
type Dictionary = typeof i18n.services.resourceStore.data.en.translation;

// 创建一个对象来存储获取字典的函数，这样可以支持异步加载（如果未来需要）
const dictionaries: { [key: string]: () => Promise<Dictionary> } = {
  en: () => Promise.resolve(i18n.services.resourceStore.data.en.translation),
  zh: () => Promise.resolve(i18n.services.resourceStore.data.zh.translation),
};

/**
 * 根据给定的语言环境(locale)获取翻译字典。
 * 如果请求的语言环境不受支持，则返回默认语言的字典。
 * @param locale - 请求的语言环境字符串 (例如 "en", "zh")
 * @returns 返回一个包含翻译键值对的 Promise<Dictionary>
 */
export const getTranslationsDictionary = async (locale: string): Promise<Dictionary> => {
  // 检查请求的 locale 是否在支持的语言列表中，否则使用默认语言
  const lang = SUPPORTED_LANGUAGES.includes(locale) ? locale : DEFAULT_LANGUAGE;
  
  // 从我们的字典对象中查找并执行相应的函数
  if (dictionaries[lang]) {
    return dictionaries[lang]();
  }
  
  // 理论上，由于上面的检查，这行代码不会被执行，但作为安全回退
  return dictionaries[DEFAULT_LANGUAGE]();
};
