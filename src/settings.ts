export type Language = 'auto' | 'zh' | 'en';
export interface Settings {
  language: Language;
  fontEnabled: boolean;
  fontColor: string;
  backgroundEnabled: boolean;
  backgroundColor: string;
}
export const defaults: Settings = {
  language: 'auto', fontEnabled: true, fontColor: '#ff0000',
  backgroundEnabled: false, backgroundColor: '#ffff00',
};
export function readSettings(value: unknown): Settings {
  const result = { ...defaults };
  if (!value || typeof value !== 'object') return result;
  const data = value as Record<string, unknown>;
  if ('language' in value && (value.language === 'auto' || value.language === 'zh' || value.language === 'en')) result.language = value.language;
  for (const key of ['fontEnabled', 'backgroundEnabled'] as const) {
    if (key in data && typeof data[key] === 'boolean') result[key] = data[key];
  }
  for (const key of ['fontColor', 'backgroundColor'] as const) {
    if (key in data && typeof data[key] === 'string' && /^#[\da-f]{6}$/i.test(data[key])) result[key] = data[key];
  }
  return result;
}
export function resolveLanguage(language: Language, hostLanguage: string): string {
  return language === 'auto' ? hostLanguage : language;
}
