import { getLanguage } from 'obsidian';
import { messageFor } from './messages';
export function t(key: Parameters<typeof messageFor>[1]): string { return messageFor(getLanguage(), key); }
