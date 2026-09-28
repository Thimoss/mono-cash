import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  Receipt,
  Settings,
  Sparkles,
} from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { BorderRadius, Spacing } from '@/constants/theme';
import BillsScreen from '@/screens/Bills';
import Dashboard from '@/screens/Dashboard';
import KantongDetail from '@/screens/KantongDetail';
import SettingsScreen from '@/screens/Settings';
import WishlistScreen from '@/screens/Wishlist';
import WishlistDetail from '@/screens/WishlistDetail';
import { useTranslation } from '@/hooks/use-translation';
import { TranslationKey } from '@/constants/translations';
import { useTheme } from '@/hooks/use-theme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { ActiveScreen } from '@/types';

type NavTabItem = {
  key: ActiveScreen;
  labelKey: TranslationKey;
  icon: (color: string, size: number) => React.ReactNode;
};

const NAV_TABS: NavTabItem[] = [
  {
    key: 'DASHBOARD',
    labelKey: 'navDashboard',
    icon: (color, size) => <LayoutDashboard size={size} color={color} />,
  },
  {
    key: 'BILLS',
    labelKey: 'navBills',
    icon: (color, size) => <Receipt size={size} color={color} />,
  },
  {
    key: 'WISHLIST',
    labelKey: 'navWishlist',
    icon: (color, size) => <Sparkles size={size} color={color} />,
  },
  {
    key: 'SETTINGS',
    labelKey: 'navSettings',
    icon: (color, size) => <Settings size={size} color={color} />,
  },
];

export default function HomeScreen() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('DASHBOARD');
  const [selectedKantongId, setSelectedKantongId] = useState<string | null>(null);
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | null>(null);

  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const themeMode = useFinanceStore((state) => state.themeMode);
  const { t } = useTranslation();

  const handleSelectScreen = (screen: ActiveScreen) => {
    if (screen === 'DASHBOARD') {
      setSelectedKantongId(null);
    }
    if (screen === 'WISHLIST') {
      setSelectedWishlistId(null);
    }
    setActiveScreen(screen);
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'DASHBOARD':
        return (
          <Dashboard
            onNavigateBills={() => handleSelectScreen('BILLS')}
            onNavigateWishlist={() => handleSelectScreen('WISHLIST')}
            onNavigateSettings={() => handleSelectScreen('SETTINGS')}
            onSelectKantong={(kantong) => {
              setSelectedKantongId(kantong.id);
              setActiveScreen('KANTONG_DETAIL');
            }}
          />
        );
      case 'KANTONG_DETAIL':
        if (selectedKantongId) {
          return (
            <KantongDetail
              kantongId={selectedKantongId}
              onBack={() => {
                setSelectedKantongId(null);
                setActiveScreen('DASHBOARD');
              }}
            />
          );
        }
        return (
          <Dashboard
            onNavigateBills={() => handleSelectScreen('BILLS')}
            onNavigateWishlist={() => handleSelectScreen('WISHLIST')}
            onNavigateSettings={() => handleSelectScreen('SETTINGS')}
            onSelectKantong={(kantong) => {
              setSelectedKantongId(kantong.id);
              setActiveScreen('KANTONG_DETAIL');
            }}
          />
        );
      case 'BILLS':
        return <BillsScreen onBack={() => handleSelectScreen('DASHBOARD')} />;
      case 'WISHLIST':
        return (
          <WishlistScreen
            onBack={() => handleSelectScreen('DASHBOARD')}
            onSelectWishlist={(wishlist) => {
              setSelectedWishlistId(wishlist.id);
              setActiveScreen('WISHLIST_DETAIL');
            }}
          />
        );
      case 'WISHLIST_DETAIL':
        if (selectedWishlistId) {
          return (
            <WishlistDetail
              wishlistId={selectedWishlistId}
              onBack={() => {
                setSelectedWishlistId(null);
                setActiveScreen('WISHLIST');
              }}
            />
          );
        }
        return (
          <WishlistScreen
            onBack={() => handleSelectScreen('DASHBOARD')}
            onSelectWishlist={(wishlist) => {
              setSelectedWishlistId(wishlist.id);
              setActiveScreen('WISHLIST_DETAIL');
            }}
          />
        );
      case 'SETTINGS':
        return <SettingsScreen onBack={() => handleSelectScreen('DASHBOARD')} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.screenContainer}>{renderActiveScreen()}</View>

        <View
          style={[
            styles.floatingNavBarContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              bottom: Math.max(24, insets.bottom),
            },
          ]}
        >
          <View style={styles.navBar}>
            {NAV_TABS.map((tab) => {
              const isActive =
                activeScreen === tab.key ||
                (tab.key === 'DASHBOARD' && activeScreen === 'KANTONG_DETAIL') ||
                (tab.key === 'WISHLIST' && activeScreen === 'WISHLIST_DETAIL');
              const activeColor = colors.accent;
              const inactiveColor = colors.textSecondary;
              const iconColor = isActive ? activeColor : inactiveColor;

              return (
                <Pressable
                  key={tab.key}
                  onPress={() => handleSelectScreen(tab.key)}
                  style={styles.navTab}
                  hitSlop={6}
                >
                  <View
                    style={[
                      styles.navIconContainer,
                      isActive && styles.navIconActiveContainer,
                    ]}
                  >
                    {tab.icon(iconColor, 19)}
                  </View>
                  <ThemedText
                    variant="caption"
                    weight={isActive ? 'bold' : 'medium'}
                    style={[
                      styles.navText,
                      { color: isActive ? activeColor : inactiveColor },
                    ]}
                  >
                    {t(tab.labelKey)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  floatingNavBarContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  navBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one * 1.5,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 3,
  },
  navIconContainer: {
    borderRadius: BorderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  navIconActiveContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  navText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
