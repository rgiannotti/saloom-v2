import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View
} from "react-native";

import { useAuth } from "../auth/AuthContext";

export const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
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
          <Text style={styles.title}>Bienvenido</Text>
          <Text style={styles.subtitle}>Ingresá tu email y contraseña para continuar.</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            textContentType="emailAddress"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showPassword}
            style={styles.input}
            textContentType="password"
          />
          <TouchableWithoutFeedback onPress={() => setShowPassword((prev) => !prev)}>
            <View style={styles.checkboxRow}>
              <View style={[styles.checkbox, showPassword && styles.checkboxChecked]}>
                {showPassword ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>
              <Text style={styles.togglePassword}>
                {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              </Text>
            </View>
          </TouchableWithoutFeedback>

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
              <Text style={styles.buttonLabel}>Ingresar</Text>
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
    padding: 24,
    alignItems: "center"
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
    elevation: 3,
    width: "90%",
    maxWidth: 400
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff"
  },
  checkboxChecked: {
    backgroundColor: "#38bdf8",
    borderColor: "#38bdf8"
  },
  checkboxMark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700"
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
    backgroundColor: "#38bdf8",
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
  },
  togglePassword: {
    color: "#0f172a",
    fontWeight: "600"
  }
});
