import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
import { useTheme } from '@/hooks/use-theme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { ActiveScreen } from '@/types';

type NavTabItem = {
  key: ActiveScreen;
  label: string;
  icon: (color: string, size: number) => React.ReactNode;
};

const NAV_TABS: NavTabItem[] = [
  {
    key: 'DASHBOARD',
    label: 'Dashboard',
    icon: (color, size) => <LayoutDashboard size={size} color={color} />,
  },
  {
    key: 'BILLS',
    label: 'Bills',
    icon: (color, size) => <Receipt size={size} color={color} />,
  },
  {
    key: 'WISHLIST',
    label: 'Wishlist',
    icon: (color, size) => <Sparkles size={size} color={color} />,
  },
  {
    key: 'SETTINGS',
    label: 'Settings',
    icon: (color, size) => <Settings size={size} color={color} />,
  },
];

export default function HomeScreen() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('DASHBOARD');
  const [selectedKantongId, setSelectedKantongId] = useState<string | null>(null);

  const colors = useTheme();
  const themeMode = useFinanceStore((state) => state.themeMode);

  const handleSelectScreen = (screen: ActiveScreen) => {
    if (screen === 'DASHBOARD') {
      setSelectedKantongId(null);
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
        return <WishlistScreen onBack={() => handleSelectScreen('DASHBOARD')} />;
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

        <SafeAreaView
          edges={['bottom', 'left', 'right']}
          style={[
            styles.navBarWrapper,
            { backgroundColor: colors.card, borderTopColor: colors.cardBorder },
          ]}
        >
          <View style={styles.navBar}>
            {NAV_TABS.map((tab) => {
              const isActive =
                activeScreen === tab.key ||
                (tab.key === 'DASHBOARD' && activeScreen === 'KANTONG_DETAIL');
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
                  <View style={[styles.navIconContainer, isActive && styles.navIconActiveContainer]}>
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
                    {tab.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </SafeAreaView>
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
  navBarWrapper: {
    borderTopWidth: 1,
  },
  navBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.one * 1.5,
    paddingBottom: Spacing.one,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  navIconContainer: {
    width: 36,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconActiveContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
  },
  navText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
