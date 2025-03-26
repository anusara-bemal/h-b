"use client";

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { SettingsProvider } from '@/context/settings-context';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <ThemeProvider>
        {children}
        <Toaster position="top-right" />
      </ThemeProvider>
    </SettingsProvider>
  );
} 