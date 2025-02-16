import { registerRootComponent } from 'expo';
import React from 'react';
import { StatusBar } from 'react-native';
import Navigation from '../navigation/Navigation';

import { SMARTLOOK_API_KEY } from '@/constants/SmartlookKey';
import Smartlook from 'react-native-smartlook-analytics'

Smartlook.instance.preferences.setProjectKey(
  SMARTLOOK_API_KEY 
);
Smartlook.instance.start();

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Navigation />
    </>
  );
}

registerRootComponent(App);
