import { useCallback } from 'react';
import { getTranslation, TranslationKey } from '@/constants/translations';
import { useFinanceStore } from '@/store/useFinanceStore';

export function useTranslation() {
  const language = useFinanceStore((state) => state.language);

  const t = useCallback(
    (key: TranslationKey): string => getTranslation(language, key),
    [language],
  );

  return { t, language };
}
