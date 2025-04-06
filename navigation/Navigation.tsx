import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';

// Screens
import MapExplorerScreen from '../screens/MapExplorerScreen';
import DirectionsScreen from '../screens/DirectionsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UpdatesScreen from '../screens/UpdatesScreen';
import CalendarScreen from '@/screens/CalendarScreen';

interface TabBarIconProps {
    route: RouteProp<any, string>;
    focused: boolean;
    color: string;
    size: number;
}  

const getTabBarIconName = (route: RouteProp<any, string>, focused: boolean): keyof typeof Ionicons.glyphMap => {
    let iconName: keyof typeof Ionicons.glyphMap = 'home'; // Default fallback
  
    if (route.name === 'Map') {
      iconName = focused ? 'home' : 'home-outline';
    } else if (route.name === 'Directions') {
      iconName = focused ? 'navigate' : 'navigate-outline';
    } else if (route.name === 'Settings') {
      iconName = focused ? 'settings' : 'settings-outline';
    } else if (route.name === 'Updates') {
      iconName = focused ? 'information-circle' : 'information-circle-outline';
    }
    return iconName;
};

const Tab = createBottomTabNavigator();

export const TabBarIcon = ({ route, focused, color, size }: TabBarIconProps) => {
    const iconName = getTabBarIconName(route, focused);
    return <Ionicons name={iconName} size={size} color={color} />;
};

interface NavigationProps {
    // You can define specific props if needed, e.g., user information
}

export default function Navigation({}: NavigationProps) {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
            // Initialize iconName with a valid Ionicons name
            let iconName: keyof typeof Ionicons.glyphMap = 'home'; // Default fallback

            if (route.name === 'Map') {
                iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Directions') {
                iconName = focused ? 'navigate' : 'navigate-outline';
            } else if (route.name === 'Settings') {
                iconName = focused ? 'settings' : 'settings-outline';
            } else if (route.name === 'Updates') {
                iconName = focused ? 'information-circle' : 'information-circle-outline';
            } else if (route.name === 'Calendar') {
                iconName = focused ? 'calendar' : 'calendar-outline'; }


            // Return the Ionicons component with a valid `name` prop
            return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#722F37',
            tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Map" component={MapExplorerScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Directions" component={DirectionsScreen} />
        <Tab.Screen name="Updates" component={UpdatesScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
        <Tab.Screen name="Calendar" component={CalendarScreen} />
        </Tab.Navigator>
    );
}