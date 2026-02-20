import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import PlayerAccountScreen from '../screens/PlayerAccountScreen';
import InGameOverviewScreen from '../screens/InGameOverviewScreen';
import SignupScreen from '../screens/SignupScreen';
import { authService } from '../services/auth';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

export { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();

    // Subscribe to auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName={isAuthenticated ? 'PlayerAccount' : 'Login'}
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
            name="Signup"
            component={SignupScreen}
            options={{ 
              title: 'Create Account',
              headerBackVisible: true,
            }}
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
