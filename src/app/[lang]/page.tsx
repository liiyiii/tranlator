'use client';

import Link from 'next/link';
// **【关键修改】导入 useParams Hook**
import { useParams } from 'next/navigation';
import React from 'react';

// **【关键修改】组件不再需要从 props 接收 params**
export default function HomePage() {
  // **【关键修改】使用 Hook 来获取路由参数**
  const params = useParams();
  // useParams 返回的对象可能包含字符串或字符串数组，我们进行类型断言
  const lang = params.lang as string;

  return (
    <div>
      <h1>Test Page</h1>
      <p>Current language: {lang}</p>
      <p>This is a simplified page to isolate the 'client-only' error.</p>
      <Link href={`/${lang}/tool`}>Go to Tool Page</Link>
    </div>
  );
}