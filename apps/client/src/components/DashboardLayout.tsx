import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";

import { Sidebar, SidebarItem } from "./Sidebar";
import { useAuth } from "../auth/AuthContext";

interface DashboardLayoutProps {
  userName: string;
  items: SidebarItem[];
  activeItem: string;
  onSelectItem: (key: string) => void;
  children: ReactNode;
}

export const DashboardLayout = ({
  userName,
  items,
  activeItem,
  onSelectItem,
  children
}: DashboardLayoutProps) => {
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 1024;
  const isMediumScreen = width >= 768;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerTranslate = useRef(new Animated.Value(-400)).current;
  const drawerWidth = Math.min(width * 0.78, isMediumScreen ? 360 : 320);

  const headerTitle = useMemo(() => {
    const current = items.find((item) => item.key === activeItem);
    return current?.label ?? "Panel";
  }, [items, activeItem]);

  const openDrawer = () => {
    setDrawerVisible(true);
    setDrawerOpen(true);
    Animated.timing(drawerTranslate, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true
    }).start();
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    Animated.timing(drawerTranslate, {
      toValue: -drawerWidth,
      duration: 220,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished) {
        setDrawerVisible(false);
      }
    });
  };

  useEffect(() => {
    if (!drawerVisible) {
      drawerTranslate.setValue(-drawerWidth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerWidth]);

  useEffect(() => {
    if (isLargeScreen && drawerVisible) {
      closeDrawer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLargeScreen]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {isLargeScreen ? (
          <Sidebar
            items={items}
            activeKey={activeItem}
            onSelect={onSelectItem}
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((prev) => !prev)}
            onLogout={logout}
          />
        ) : null}

        <View style={styles.contentArea}>
          <View style={styles.topBar}>
            {!isLargeScreen ? (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={drawerOpen ? closeDrawer : openDrawer}
              >
                <Text style={styles.menuButtonLabel}>☰</Text>
              </TouchableOpacity>
            ) : null}
            <View style={styles.titleGroup}>
              <Text style={styles.title}>{headerTitle}</Text>
              <Text style={styles.subtitle}>Bienvenido/a, {userName}</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarLabel}>{userName.slice(0, 2).toUpperCase()}</Text>
            </View>
          </View>

          <View
            style={[
              styles.moduleCard,
              isLargeScreen ? styles.moduleCardDesktop : styles.moduleCardMobile
            ]}
          >
            {children}
          </View>
        </View>
      </View>

      {!isLargeScreen ? (
        <Modal
          transparent
          visible={drawerVisible}
          animationType="none"
          onRequestClose={closeDrawer}
        >
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeDrawer} />
          <Animated.View
            style={[
              styles.mobileSidebar,
              {
                width: drawerWidth,
                transform: [{ translateX: drawerTranslate }]
              }
            ]}
          >
            <Sidebar
              items={items}
              activeKey={activeItem}
              onSelect={(key) => {
                onSelectItem(key);
                closeDrawer();
              }}
              showBorder={false}
              onLogout={logout}
            />
          </Animated.View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f1f5f9"
  },
  container: {
    flex: 1,
    flexDirection: "row"
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center"
  },
  menuButtonLabel: {
    fontSize: 20,
    color: "#0f172a"
  },
  titleGroup: {
    flex: 1
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a"
  },
  subtitle: {
    fontSize: 14,
    color: "#475569"
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarLabel: {
    color: "#fff",
    fontWeight: "700"
  },
  moduleCard: {
    flex: 1
  },
  moduleCardDesktop: {
    // shadowColor: "#0f172a",
    // shadowOpacity: 0.06,
    // shadowRadius: 20,
    // shadowOffset: { width: 0, height: 8 }
  },
  moduleCardMobile: {
    // elevation: 3
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)"
  },
  mobileSidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "#fff",
    paddingTop: 32,
    shadowColor: "#0f172a",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 6, height: 0 },
    elevation: 6
  }
});
