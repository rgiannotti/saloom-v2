import React from "react";
import {
  Dimensions,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SaloomLogo } from "../components/SaloomLogo";
import { fonts } from "../theme/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const HERO_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAX3Ijfv8lBz0IneIVSrLaZRnZ3UxrHfCBCyNKHasnjcVa4LSoiAG1uAa7DCzF75pbvzoPjVH1wEpBIgnDWUTc_4CgKpeVh2o6phqYOLUifzJn5TOhjBaTkug1QgiwFFSnYA1fnYWJ6LBXT3FSclMVSdMjnjtemAO6Oqf58JKPGtUZxCORtSI7sma0F9dNvex-xn9s8uADvv_tjPX3pPDviQOssDf0SYgbeHd2S8DQGp7TsaSUiJQ1l_WZFYTKf4l5jNX-IizeYXxk";

interface Props {
  onLogin: () => void;
  onGetStarted: () => void;
}

export const WelcomeScreen = ({ onLogin, onGetStarted }: Props) => {
  const cardWidth = Math.min(SCREEN_WIDTH - 48, 320);
  const cardHeight = cardWidth * (5 / 4);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <View style={styles.inner}>
        {/* Header – Logo */}
        <View style={styles.header}>
          <SaloomLogo width={150} />
        </View>

        {/* Main – Hero image card */}
        <View style={styles.main}>
          <View style={[styles.cardRing, { width: cardWidth + 16, height: cardHeight + 16 }]}>
            <ImageBackground
              source={{ uri: HERO_URI }}
              style={{ width: cardWidth, height: cardHeight, borderRadius: 24, overflow: "hidden" }}
              resizeMode="cover"
            >
              {/* Gradient overlay (bottom → transparent) */}
              <View style={StyleSheet.absoluteFill}>
                <View style={{ flex: 1 }} />
                <View style={styles.imageGradient} />
              </View>

              {/* Badge */}
              <View style={styles.badge}>
                <View style={styles.badgeIconWrap}>
                  <Text style={styles.badgeIconText}>✦</Text>
                </View>
                <View>
                  <Text style={styles.badgeLabel}>Saloom</Text>
                  <Text style={styles.badgeTitle}>Wellness &amp; Beauty</Text>
                </View>
              </View>
            </ImageBackground>
          </View>
        </View>

        {/* Bottom sheet */}
        <View style={styles.bottomSheet}>
          <View style={styles.dragHandle} />

          <Text style={styles.title}>
            Tu belleza,{"\n"}
            <Text style={styles.titleAccent}>tu tiempo.</Text>
          </Text>

          <Text style={styles.subtitle}>
            Reserva citas fácil y rápido en los mejores salones, barberías y spas cerca de ti.
          </Text>

          {/* Dots */}
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onGetStarted}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Empezar ahora</Text>
            <Text style={styles.primaryButtonArrow}>→</Text>
          </TouchableOpacity>

          {/* Secondary CTA */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onLogin}
            activeOpacity={0.75}
          >
            <Text style={styles.secondaryButtonText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const PRIMARY = "#FF3333";
const ACCENT = "#C8A2F2";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  inner: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
  },

  /* Header */
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },

  /* Main */
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  cardRing: {
    backgroundColor: "#ffffff",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  imageGradient: {
    height: "50%",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  badge: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  badgeIconWrap: {
    backgroundColor: `${ACCENT}33`,
    borderRadius: 999,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeIconText: {
    fontSize: 14,
    color: ACCENT,
  },
  badgeLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  badgeTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: "#1f2937",
  },

  /* Bottom sheet */
  bottomSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 48,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: -10 },
    elevation: 5,
  },
  dragHandle: {
    position: "absolute",
    top: 16,
    width: 48,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  title: {
    fontSize: 36,
    fontFamily: fonts.serifItalic,
    color: "#1A1A1A",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: PRIMARY,
    fontFamily: fonts.serifItalic,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: fonts.medium,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 32,
    maxWidth: 300,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: `${ACCENT}66`,
  },
  dotActive: {
    width: 32,
    backgroundColor: PRIMARY,
  },
  primaryButton: {
    width: "100%",
    height: 56,
    backgroundColor: PRIMARY,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  primaryButtonArrow: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  secondaryButton: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#4b5563",
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
});
