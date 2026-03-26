import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path, G, Circle } from "react-native-svg";

import { useAuth } from "../auth/AuthContext";
import { SaloomLogo } from "../components/SaloomLogo";
import { fonts } from "../theme/fonts";

interface Props {
  onBack?: () => void;
}

const MailIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke="#94a3b8"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M22 6l-10 7L2 6"
      stroke="#94a3b8"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EyeIcon = ({ visible }: { visible: boolean }) =>
  visible ? (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"
        stroke="#94a3b8"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"
        stroke="#94a3b8"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1 1l22 22"
        stroke="#94a3b8"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ) : (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="#94a3b8"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3} stroke="#94a3b8" strokeWidth={1.8} />
    </Svg>
  );

const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </Svg>
);

const AppleIcon = () => (
  <Svg width={16} height={20} viewBox="0 0 384 512">
    <Path
      fill="#000000"
      d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"
    />
  </Svg>
);

export const LoginScreen = ({ onBack }: Props) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
          )}

          {/* Logo + Header */}
          <View style={styles.headerSection}>
            <View style={styles.logoWrap}>
              <SaloomLogo width={192} />
            </View>
            <Text style={styles.title}>¡Hola de nuevo!</Text>
            <Text style={styles.subtitle}>Tu bienestar, agendado.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email o Teléfono</Text>
              <View style={styles.inputRow}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#94a3b8"
                  style={[styles.input, styles.inputWithIcon]}
                  textContentType="emailAddress"
                />
                <View style={styles.inputIconRight} pointerEvents="none">
                  <MailIcon />
                </View>
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  textContentType="password"
                />
                <TouchableOpacity
                  style={styles.eyeToggle}
                  onPress={() => setShowPassword((p) => !p)}
                  activeOpacity={0.7}
                >
                  <EyeIcon visible={showPassword} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.forgotWrap} onPress={() => {}} activeOpacity={0.7}>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginButton, !canSubmit && styles.loginButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O CONTINÚA CON</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.85}>
                <GoogleIcon />
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.85}>
                <AppleIcon />
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Nuevo en Saloom? </Text>
            <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Crea una cuenta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const PRIMARY = "#ff3b3b";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },

  /* Back */
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  backArrow: {
    fontSize: 18,
    color: "#0d141b",
    fontFamily: fonts.regular,
  },

  /* Header */
  headerSection: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
  },
  logoWrap: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: "#0d141b",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
  },

  /* Form */
  form: {
    gap: 20,
    marginTop: 16,
  },
  fieldWrap: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: "#0d141b",
    marginLeft: 4,
  },

  /* Email input */
  inputRow: {
    position: "relative",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#0d141b",
    fontFamily: fonts.regular,
    backgroundColor: "transparent",
    ...Platform.select({
      web: {
        // @ts-ignore - web only
        outlineColor: `${PRIMARY}80`,
        outlineWidth: 1,
      },
    }),
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  inputIconRight: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },

  /* Password input */
  passwordRow: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    overflow: "hidden",
  },
  passwordInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#0d141b",
    fontFamily: fonts.regular,
    backgroundColor: "transparent",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    ...Platform.select({
      web: {
        // @ts-ignore - web only
        outlineColor: `${PRIMARY}80`,
        outlineWidth: 1,
      },
    }),
  },
  eyeToggle: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#e2e8f0",
  },
  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginRight: 4,
  },
  forgotText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: "#64748b",
  },

  /* Error */
  error: {
    color: "#b91c1c",
    fontSize: 13,
    fontFamily: fonts.medium,
    marginTop: -8,
  },

  /* Login button */
  loginButton: {
    height: 56,
    backgroundColor: PRIMARY,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ef4444",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginTop: 4,
  },
  loginButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },

  /* Divider */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#94a3b8",
    letterSpacing: 1,
  },

  /* Social */
  socialRow: {
    flexDirection: "row",
    gap: 16,
  },
  socialButton: {
    flex: 1,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  socialText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: "#334155",
  },

  /* Footer */
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: "#64748b",
  },
  footerLink: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: PRIMARY,
  },
});
