import { getLanguage } from 'obsidian';
import { messageFor } from './messages';
import { resolveLanguage, type Language } from './settings';
export function t(language: Language, key: Parameters<typeof messageFor>[1]): string {
  return messageFor(resolveLanguage(language, getLanguage()), key);
}
