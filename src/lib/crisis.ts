const crisisHotlines: Record<string, string> = {
  us: "988 (Suicide & Crisis Lifeline)",
  uk: "111 option 2 (NHS Mental Health)",
  fr: "3114 (Suicide Écoute)",
  de: "0800-111-0-111 (Telefonseelsorge)",
  es: "024 (Línea de Conducta Suicida)",
  it: "199-284-284 (Telefono Amico)",
  pt: "800 202 669 (SOS Voz Amiga)",
  ar: "920003334 (خط مساندة)",
  cn: "010-8295-1332",
  jp: "0120-279-338 (いのちの電話)",
  ru: "8-800-333-44-34 (Телефон доверия)",
  au: "13 11 14 (Lifeline Australia)",
};

export function getCrisisHotline(locale: string): string {
  const map: Record<string, string> = {
    en: crisisHotlines.us ?? "988 (Suicide & Crisis Lifeline)",
    fr: crisisHotlines.fr ?? "3114 (Suicide Écoute)",
    es: crisisHotlines.es ?? "024 (Línea de Conducta Suicida)",
    de: crisisHotlines.de ?? "0800-111-0-111 (Telefonseelsorge)",
    it: crisisHotlines.it ?? "199-284-284 (Telefono Amico)",
    pt: crisisHotlines.pt ?? "800 202 669 (SOS Voz Amiga)",
    ar: crisisHotlines.ar ?? "920003334 (خط مساندة)",
    zh: crisisHotlines.cn ?? "010-8295-1332",
    ja: crisisHotlines.jp ?? "0120-279-338 (いのちの電話)",
    ru: crisisHotlines.ru ?? "8-800-333-44-34 (Телефон доверия)",
  };
  return map[locale] ?? crisisHotlines.us ?? "988 (Suicide & Crisis Lifeline)";
}
