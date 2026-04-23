import React from 'react';
import { Redirect } from 'expo-router';
import { useUserStore } from '@/stores/useUserStore';

export default function Index() {
  const isOnboarded = useUserStore((s) => s.isOnboarded);
  return <Redirect href={isOnboarded ? '/(tabs)/home' : '/onboarding'} />;
}
