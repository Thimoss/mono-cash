import React from 'react';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
        <ThemeProvider value={DarkTheme}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Palette.black },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
