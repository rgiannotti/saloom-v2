import { decode } from "base-64";

// Polyfill atob for Hermes (React Native < 0.72)
if (typeof global.atob === "undefined") {
  global.atob = decode;
}

import { DMSerifDisplay_400Regular_Italic } from "@expo-google-fonts/dm-serif-display";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts
} from "@expo-google-fonts/manrope";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from "react-native";

import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";

type AuthScreen = "welcome" | "login";

const BootstrappedApp = () => {
  const { session, initializing } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>("welcome");

  if (initializing) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#FF3333" />
        <Text style={styles.loadingText}>Cargando sesión…</Text>
      </SafeAreaView>
    );
  }

  if (session) {
    return <HomeScreen />;
  }

  if (authScreen === "login") {
    return <LoginScreen onBack={() => setAuthScreen("welcome")} />;
  }

  return (
    <WelcomeScreen
      onLogin={() => setAuthScreen("login")}
      onGetStarted={() => setAuthScreen("login")}
    />
  );
};

export function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    DMSerifDisplay_400Regular_Italic
  });

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#FF3333" />
      </SafeAreaView>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <BootstrappedApp />
    </AuthProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  loadingText: {
    color: "#101922",
    fontFamily: "Manrope_400Regular"
  }
});
