import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../SettingsScreen';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)), 
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Connect Google Calendar')).toBeTruthy();
  });

  it('requests location permission and gets location on button press', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 45.5017, longitude: -73.5673 },
    });

    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Get Location'));

    await waitFor(() => {
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
    });
  });

  it('handles permission denied', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

    const { getByText } = render(<SettingsScreen />);
    const getLocationButton = getByText('Get Location');

    fireEvent.press(getLocationButton);

    await waitFor(() => {
      expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
    });
  });
});