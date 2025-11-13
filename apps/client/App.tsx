import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from "react-native";

import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";

const BootstrappedApp = () => {
  const { session, initializing } = useAuth();

  if (initializing) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Cargando sesión…</Text>
      </SafeAreaView>
    );
  }

  return session ? <HomeScreen /> : <LoginScreen />;
};

export function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <BootstrappedApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  loadingText: {
    color: "#0f172a"
  }
});

export default App;
