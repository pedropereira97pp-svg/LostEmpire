import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from '../screens/LoginScreen';
import PlayerAccountScreen from '../screens/PlayerAccountScreen';
import InGameOverviewScreen from '../screens/InGameOverviewScreen';

export type RootStackParamList = {
  Login: undefined;
  PlayerAccount: undefined;
  InGameOverview: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1F2937',
            },
            headerTintColor: '#F9FAFB',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: '#111827',
            },
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PlayerAccount"
            component={PlayerAccountScreen}
            options={{
              title: 'Player Account',
              headerBackVisible: false,
            }}
          />
          <Stack.Screen
            name="InGameOverview"
            component={InGameOverviewScreen}
            options={{
              title: 'Lost Empire',
              headerBackVisible: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
