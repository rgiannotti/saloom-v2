import React from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "../auth/AuthContext";

export const HomeScreen = () => {
  const { session, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Hola, {session?.user.name ?? "usuario"}</Text>
        <Text style={styles.subtitle}>Bienvenido a Saloom</Text>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutLabel}>Cerrar sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a"
  },
  subtitle: {
    fontSize: 16,
    color: "#475569"
  },
  logoutButton: {
    margin: 24,
    backgroundColor: "#38bdf8",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center"
  },
  logoutLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16
  }
});
