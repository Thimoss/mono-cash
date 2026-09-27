import { Colors, ColorTheme } from '@/constants/theme';
import { useFinanceStore } from '@/store/useFinanceStore';

export function useTheme(): ColorTheme {
  const themeMode = useFinanceStore((state) => state.themeMode);
  return (Colors[themeMode] ?? Colors.dark) as ColorTheme;
}
