// image-translator-new/src/app/[lang]/page.tsx
import Link from 'next/link';

export default async function HomePage({ params }: { params: { lang: string } }) {
  return (
    <div>
      <h1>Test Page</h1>
      <p>Current language: {params.lang}</p>
      <p>This is a simplified page to isolate the 'client-only' error.</p>
      <Link href={`/${params.lang}/tool`}>Go to Tool Page</Link>
    </div>
  );
}