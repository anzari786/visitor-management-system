import type { Locale } from '../config';
import { am } from './am';
import { en } from './en';
import type { Dictionary } from './en';
import { ti } from './ti';

export type { Dictionary, TranslationKey } from './en';

export const dictionaries: Record<Locale, Dictionary> = { en, am, ti };
