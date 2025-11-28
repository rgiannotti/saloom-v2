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
  const animatedWidth = React.useRef(new Animated.Value(collapsed ? 60 : 260)).current;

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
            <SidebarLogo collapsed={collapsed} />
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
          <TouchableOpacity
            style={[
              styles.logoutButton,
              collapsed && styles.logoutButtonCollapsed,
              styles.logoutButtonFull
            ]}
            onPress={onLogout}
          >
            <Text style={[styles.logoutText, collapsed && styles.logoutTextCollapsed]}>
              {collapsed ? "⏻" : "Cerrar sesión"}
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
    marginTop: 12,
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
    gap: 10
  },
  footerLogo: {
    alignItems: "center",
    justifyContent: "center"
  },
  logoutButtonFull: {
    alignSelf: "stretch"
  }
});
