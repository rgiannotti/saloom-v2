import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { useAuth } from "../auth/AuthContext";

export const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido al iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.card}>
          <Text style={styles.title}>Ingreso para profesionales</Text>
          <Text style={styles.subtitle}>
            Usa tu correo y contraseña del backoffice. Solo usuarios PRO con un cliente asignado
            pueden continuar.
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Correo"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            textContentType="emailAddress"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            style={styles.input}
            textContentType="password"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[styles.button, !canSubmit ? styles.buttonDisabled : undefined]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonLabel}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    padding: 24
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  title: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "700"
  },
  subtitle: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5f5",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#0f172a",
    backgroundColor: "#fff"
  },
  error: {
    color: "#b91c1c",
    fontSize: 14
  },
  button: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center"
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16
  }
});
