import { StatusBar } from "expo-status-bar";
import { Platform, SafeAreaView, StyleSheet, Text, View } from "react-native";

export function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.badge}>Client App</Text>
        <Text style={styles.title}>Saloom Client</Text>
        <Text style={styles.subtitle}>
          Base Expo + React Native lista para construir la experiencia móvil.
        </Text>
        <Text style={styles.meta}>
          Plataforma: <Text style={styles.metaHighlight}>{Platform.OS}</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617"
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12
  },
  badge: {
    color: "#22d3ee",
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase"
  },
  title: {
    color: "#f8fafc",
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center"
  },
  subtitle: {
    color: "#cbd5f5",
    textAlign: "center"
  },
  meta: {
    color: "#94a3b8"
  },
  metaHighlight: {
    color: "#14b8a6"
  }
});

export default App;
