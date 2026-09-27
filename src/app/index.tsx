import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Palette, Spacing, Typography } from '@/constants/theme';
import BillsScreen from '@/screens/Bills';
import Dashboard from '@/screens/Dashboard';
import KantongDetail from '@/screens/KantongDetail';
import SettingsScreen from '@/screens/Settings';
import WishlistScreen from '@/screens/Wishlist';
import { ActiveScreen } from '@/types';

const TAB_LABELS: Record<string, string> = {
  DASHBOARD: '[ CORE ]',
  BILLS: '[ BILLS ]',
  WISHLIST: '[ WISHLIST ]',
  SETTINGS: '[ SETTINGS ]',
};

export default function HomeScreen() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('DASHBOARD');
  const [selectedKantongId, setSelectedKantongId] = useState<string | null>(null);

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
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.screenContainer}>{renderActiveScreen()}</View>

        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.navBar}>
          {(['DASHBOARD', 'BILLS', 'WISHLIST', 'SETTINGS'] as const).map((screen) => {
            const isActive =
              activeScreen === screen ||
              (screen === 'DASHBOARD' && activeScreen === 'KANTONG_DETAIL');
            const label = TAB_LABELS[screen] ?? screen;

            return (
              <Pressable
                key={screen}
                onPress={() => handleSelectScreen(screen)}
                style={[styles.navTab, isActive && styles.navTabActive]}
              >
                <ThemedText
                  variant="caption"
                  weight={isActive ? 'bold' : 'regular'}
                  style={isActive ? styles.navTextActive : styles.navText}
                >
                  {label}
                </ThemedText>
              </Pressable>
            );
          })}
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.black,
  },
  screenContainer: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.backgroundElement,
    borderTopWidth: 1,
    borderTopColor: Palette.gray800,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one * 1.5,
    paddingBottom: Spacing.one,
    gap: Spacing.two,
  },
  navTab: {
    flex: 1,
    paddingVertical: Spacing.one * 1.25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.gray800,
    backgroundColor: Palette.black,
  },
  navTabActive: {
    backgroundColor: Palette.white,
    borderColor: Palette.white,
  },
  navText: {
    color: Palette.gray400,
    fontSize: Typography.scale.xs.fontSize,
    letterSpacing: 1,
  },
  navTextActive: {
    color: Palette.black,
    fontSize: Typography.scale.xs.fontSize,
    letterSpacing: 1,
  },
});
