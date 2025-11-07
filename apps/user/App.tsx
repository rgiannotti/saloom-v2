import { StatusBar } from "expo-status-bar";
import { Platform, SafeAreaView, StyleSheet, Text, View } from "react-native";

export function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.badge}>User App</Text>
        <Text style={styles.title}>Saloom User</Text>
        <Text style={styles.subtitle}>
          Experiencia móvil pensada para los clientes finales.
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
    backgroundColor: "#0f172a"
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24
  },
  badge: {
    color: "#38bdf8",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: "600"
  },
  title: {
    color: "#e2e8f0",
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
    color: "#34d399"
  }
});

export default App;
