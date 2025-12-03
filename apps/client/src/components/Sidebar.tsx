import React from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { SidebarLogo } from "./SidebarLogo";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL } from "../config";

export interface SidebarItem {
  key: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  items: SidebarItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  showBorder?: boolean;
  onLogout?: () => void;
}

export const Sidebar = ({
  items,
  activeKey,
  onSelect,
  collapsed = false,
  onToggleCollapsed,
  showBorder = true,
  onLogout
}: SidebarProps) => {
  const { language, setLanguage, t } = useLanguage();
  const { session } = useAuth();
  const [clientLogo, setClientLogo] = React.useState<string>("");
  const animatedWidth = React.useRef(new Animated.Value(collapsed ? 60 : 260)).current;

  const resolveLogo = React.useCallback((src?: string) => {
    if (!src) return "";
    if (src.startsWith("http") || src.startsWith("data:") || src.startsWith("blob:")) {
      return src;
    }
    return `${API_BASE_URL}${src}`;
  }, []);

  React.useEffect(() => {
    let active = true;
    const fetchLogo = async () => {
      const clientId = session?.user?.client;
      const token = session?.tokens?.accessToken;
      if (!clientId || !token) {
        if (active) setClientLogo("");
        return;
      }
      try {
        const resp = await fetch(`${API_BASE_URL}/app/clients/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!resp.ok) {
          if (active) setClientLogo("");
          return;
        }
        const data = await resp.json();
        if (!active) return;
        const resolved = resolveLogo(data?.logo);
        setClientLogo(resolved);
        if (resolved && Platform.OS === "web") {
          try {
            if (data?.slug) {
              window.localStorage.setItem("saloom_client_slug", data.slug);
            }
          } catch {
            // ignore storage errors
          }
        }
      } catch {
        if (active) setClientLogo("");
      }
    };
    fetchLogo();
    return () => {
      active = false;
    };
  }, [resolveLogo, session?.tokens?.accessToken, session?.user?.client]);

  React.useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: collapsed ? 60 : 260,
      duration: 200,
      useNativeDriver: false
    }).start();
  }, [collapsed, animatedWidth]);

  return (
    <Animated.View
      style={[styles.sidebar, !showBorder && styles.sidebarNoBorder, { width: animatedWidth }]}
    >
      <View style={styles.brandRow}>
        {onToggleCollapsed ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={collapsed ? "Expandir menú" : "Colapsar menú"}
            onPress={onToggleCollapsed}
            style={styles.collapseButtonLeft}
          >
            <Text style={styles.collapseButtonLabel}>{collapsed ? "⤢" : "⤡"}</Text>
          </TouchableOpacity>
        ) : null}
        {!collapsed ? (
          <View style={styles.logoWrapper}>
            <SidebarLogo collapsed={collapsed} customLogo={clientLogo} />
          </View>
        ) : null}
      </View>
      <ScrollView
        style={styles.menuScroll}
        contentContainerStyle={[styles.menuScrollContent, styles.menuScrollSpacer]}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              style={({ pressed }) => [
                styles.menuItem,
                active && styles.menuItemActive,
                pressed && styles.menuItemPressed
              ]}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              {!collapsed ? (
                <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                  {item.label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      {onLogout ? (
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <SidebarLogo collapsed widthOverride={28} heightOverride={28} />
          </View>
          <View
            style={[
              styles.flagsContainer,
              collapsed ? styles.flagsContainerCollapsed : styles.flagsContainerExpanded
            ]}
          >
            <TouchableOpacity
              onPress={() => setLanguage("es")}
              style={[
                styles.flagButton,
                language === "es" && styles.flagButtonActive,
                collapsed && styles.flagButtonCollapsed
              ]}
            >
              <Text style={styles.flagText}>🇪🇸</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLanguage("en")}
              style={[
                styles.flagButton,
                language === "en" && styles.flagButtonActive,
                collapsed && styles.flagButtonCollapsed
              ]}
            >
              <Text style={styles.flagText}>🇺🇸</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              collapsed && styles.logoutButtonCollapsed,
              styles.logoutButtonFull
            ]}
            onPress={onLogout}
          >
            <Text style={[styles.logoutText, collapsed && styles.logoutTextCollapsed]}>
              {collapsed ? "⏻" : t.logout}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    maxWidth: 260,
    flexShrink: 0,
    height: "100%",
    backgroundColor: "#ffffff",
    borderRightColor: "#e2e8f0",
    borderRightWidth: 1,
    paddingTop: Platform.OS === "web" ? 32 : 24,
    paddingBottom: 24,
    paddingHorizontal: 12,
    gap: 16
  },
  sidebarNoBorder: {
    borderRightWidth: 0
  },
  sidebarCollapsed: {
    width: 60,
    paddingHorizontal: 12
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    position: "relative",
    minHeight: 36
  },
  collapseButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center"
  },
  collapseButtonLabel: {
    fontSize: 16
  },
  collapseButtonLeft: {
    position: "absolute",
    left: 0,
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center"
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center"
  },
  menuScroll: {
    flex: 1
  },
  menuScrollContent: {
    gap: 8,
    paddingBottom: 32
  },
  menuScrollSpacer: {
    paddingTop: 20
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12
  },
  menuItemPressed: {
    backgroundColor: "rgba(15, 23, 42, 0.05)"
  },
  menuItemActive: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)"
  },
  menuIcon: {
    fontSize: 18
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#0f172a"
  },
  menuLabelActive: {
    color: "#be123c"
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  logoutButtonCollapsed: {
    paddingVertical: 10,
    paddingHorizontal: 6
  },
  logoutText: {
    color: "#0f172a",
    fontWeight: "600"
  },
  logoutTextCollapsed: {
    fontSize: 16
  },
  footer: {
    alignItems: "center",
    gap: 10,
    marginTop: "auto"
  },
  footerLogo: {
    alignItems: "center",
    justifyContent: "center"
  },
  flagsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  flagsContainerExpanded: {
    flexDirection: "row"
  },
  flagsContainerCollapsed: {
    flexDirection: "column"
  },
  logoutButtonFull: {
    alignSelf: "stretch"
  },
  languageRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8
  },
  flagButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#fff"
  },
  flagButtonActive: {
    borderColor: "#ef4444",
    backgroundColor: "rgba(239,68,68,0.1)"
  },
  flagText: {
    fontSize: 16
  },
  flagButtonCollapsed: {
    paddingVertical: 4,
    paddingHorizontal: 6
  }
});
