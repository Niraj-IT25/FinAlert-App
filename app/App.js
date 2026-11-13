import React from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import ReportScreen from "./src/screens/ReportScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import UsersScreen from "./src/screens/UsersScreen";
import AccountScreen from "./src/screens/AccountScreen";
import { colors } from "./src/theme";

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.paper, primary: colors.ink },
};

const icons = {
  Report: ["alert-circle", "alert-circle-outline"],
  Dashboard: ["speedometer", "speedometer-outline"],
  Users: ["people", "people-outline"],
  Account: ["person-circle", "person-circle-outline"],
};

function Tabs() {
  const { isLoggedIn, canManageUsers } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.ink },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "800" },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: "600" },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={icons[route.name][focused ? 0 : 1]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Report" component={ReportScreen} options={{ title: "FinAlert", tabBarLabel: "Report" }} />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: isLoggedIn ? "ATM failures" : "Staff sign in", tabBarLabel: isLoggedIn ? "Dashboard" : "Staff" }}
      />
      {canManageUsers ? <Tab.Screen name="Users" component={UsersScreen} options={{ title: "Users" }} /> : null}
      {isLoggedIn ? <Tab.Screen name="Account" component={AccountScreen} options={{ title: "Account" }} /> : null}
    </Tab.Navigator>
  );
}

function Root() {
  const { booting } = useAuth();
  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink }}>
        <ActivityIndicator color={colors.white} size="large" />
      </View>
    );
  }
  return (
    <NavigationContainer theme={navTheme}>
      <Tabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
