"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter, locales } from "@/i18n/routing";

const langNames: Record<string, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  ar: "العربية",
  zh: "中文",
  ja: "日本語",
  ru: "Русский",
};

interface Props {
  disabled?: boolean;
}

export function LanguageSelector({ disabled }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <select
      value={locale}
      onChange={handleChange}
      disabled={disabled}
      className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-sm border border-white/10 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
    >
      {locales.map((l) => (
        <option key={l} value={l} className="bg-slate-900 text-white">
          {langNames[l] ?? l}
        </option>
      ))}
    </select>
  );
}
