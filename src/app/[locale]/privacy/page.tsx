import { setRequestLocale, getTranslations } from 'next-intl/server';

export default async function PrivacyPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Privacy');

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto text-zinc-300 space-y-8">
        <h1 className="text-4xl font-bold text-white mb-8">{t('title')}</h1>
        
        <section>
          <h2 className="text-xl font-bold text-white mb-4">{t('section1Title')}</h2>
          <p>{t('section1Content')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">{t('section2Title')}</h2>
          <p>{t('section2Content')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">{t('section3Title')}</h2>
          <p>{t('section3Content')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">{t('section4Title')}</h2>
          <p>{t('section4Content')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">{t('section5Title')}</h2>
          <p>{t('section5Content')}</p>
        </section>
        
        <p className="text-sm text-zinc-500 pt-8">{t('lastUpdated', {date: new Date().toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')})}</p>
      </div>
    </div>
  );
}
