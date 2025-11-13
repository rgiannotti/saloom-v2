import React from "react";
import {
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
}

export const Sidebar = ({
  items,
  activeKey,
  onSelect,
  collapsed = false,
  onToggleCollapsed,
  showBorder = true
}: SidebarProps) => {
  return (
    <View
      style={[
        styles.sidebar,
        collapsed && styles.sidebarCollapsed,
        !showBorder && styles.sidebarNoBorder
      ]}
    >
      <View style={styles.brandRow}>
        <SidebarLogo collapsed={collapsed} />
        {onToggleCollapsed ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={collapsed ? "Expandir menú" : "Colapsar menú"}
            onPress={onToggleCollapsed}
            style={styles.collapseButton}
          >
            <Text style={styles.collapseButtonLabel}>{collapsed ? "⤢" : "⤡"}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView
        style={styles.menuScroll}
        contentContainerStyle={styles.menuScrollContent}
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
    </View>
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
    paddingHorizontal: 16,
    gap: 16
  },
  sidebarNoBorder: {
    borderRightWidth: 0
  },
  sidebarCollapsed: {
    width: 96,
    paddingHorizontal: 12
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
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
  menuScroll: {
    flex: 1
  },
  menuScrollContent: {
    gap: 8,
    paddingBottom: 32
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
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
  }
});
