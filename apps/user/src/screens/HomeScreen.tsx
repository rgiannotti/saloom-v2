import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { useAuth } from "../auth/AuthContext";
import { SaloomLogo } from "../components/SaloomLogo";
import { API_BASE_URL } from "../config";
import { fonts } from "../theme/fonts";
import { AiAssistantScreen } from "./AiAssistantScreen";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Recommendation {
  _id: string;
  name: string;
  denomination: string;
  address: { full?: string; comunity?: string; city?: string };
  logo?: string;
  categories: { _id: string; name: string }[];
  professionals: {
    services: { price: number }[];
  }[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "peluqueria", label: "Peluquería", icon: "content-cut" },
  { id: "barberia", label: "Barbería", icon: "face-man" },
  { id: "spa", label: "Spa", icon: "flower" },
  { id: "manicure", label: "Manicure", icon: "brush" },
  { id: "masajes", label: "Masajes", icon: "human" },
] as const;

// Fallback coords: Polanco, CDMX
const FALLBACK_LAT = 19.4284;
const FALLBACK_LNG = -99.1276;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getMinPrice = (professionals: Recommendation["professionals"]): number | null => {
  const prices = professionals.flatMap((p) => p.services.map((s) => s.price)).filter((p) => p > 0);
  return prices.length > 0 ? Math.min(...prices) : null;
};

const getArea = (address: Recommendation["address"]): string =>
  address.comunity || address.city || address.full || "";

// ─── Component ───────────────────────────────────────────────────────────────

type TabId = "explore" | "map" | "ai" | "menu";

const NAV_TABS: { id: TabId; label: string; icon: ReturnType<typeof require> }[] = [
  { id: "explore", label: "Explorar",     icon: require("../../assets/icons/home.png") },
  { id: "map",     label: "Mapa",         icon: require("../../assets/icons/map.png") },
  { id: "ai",      label: "Asistente IA", icon: require("../../assets/icons/ai.png") },
  { id: "menu",    label: "Menú",         icon: require("../../assets/icons/menu.png") },
];

export const HomeScreen = () => {
  const { logout, session } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("explore");
  const [activeCategory, setActiveCategory] = useState("peluqueria");

  const scaleAnims = useRef(
    NAV_TABS.reduce<Record<TabId, Animated.Value>>((acc, tab) => {
      acc[tab.id] = new Animated.Value(1);
      return acc;
    }, {} as Record<TabId, Animated.Value>)
  ).current;

  const handleTabPress = (id: TabId) => {
    LayoutAnimation.configureNext({
      duration: 280,
      create: { type: "spring", property: "scaleXY", springDamping: 0.75 },
      update: { type: "spring", springDamping: 0.75 },
      delete: { type: "spring", property: "scaleXY", springDamping: 0.75 },
    });
    Animated.sequence([
      Animated.timing(scaleAnims[id], {
        toValue: 1.3,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[id], {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
    setActiveTab(id);
  };
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState("Mi ubicación");

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        let lat = FALLBACK_LAT;
        let lng = FALLBACK_LNG;

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          setLocationLabel("Mi ubicación");
        }

        const res = await fetch(
          `${API_BASE_URL}/app/recommendations?lat=${lat}&lng=${lng}&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${session?.tokens.accessToken}`,
            },
          }
        );
        if (!res.ok) throw new Error("No se pudieron cargar los recomendados.");
        const data: Recommendation[] = await res.json();
        setRecommendations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar recomendaciones.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [session?.tokens.accessToken]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── Explore tab content ── */}
      {activeTab !== "ai" && (
        <>
          {/* Top bar */}
          <View style={styles.topBar}>
            <SaloomLogo width={120} />
            <TouchableOpacity style={styles.locationBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="map-marker" size={16} color={PRIMARY} />
              <Text style={styles.locationText} numberOfLines={1}>{locationLabel}</Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Sub-header: search + tabs */}
          <View style={styles.subHeader}>
            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                placeholder="¿Qué servicio buscas hoy?"
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
              />
              <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
                <MaterialCommunityIcons name="tune" size={18} color={PRIMARY} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContent}
            >
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.tab, active && styles.tabActive]}
                    onPress={() => setActiveCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={cat.icon as any}
                      size={16}
                      color={active ? "#ffffff" : "#1A1A1A"}
                    />
                    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Main scroll */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recomendados para ti</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.seeAll}>Ver todo</Text>
              </TouchableOpacity>
            </View>

            {loading && (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={PRIMARY} />
              </View>
            )}

            {!loading && error && (
              <View style={styles.centered}>
                <MaterialCommunityIcons name="alert-circle-outline" size={32} color="#94a3b8" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!loading && !error && recommendations.length === 0 && (
              <View style={styles.centered}>
                <MaterialCommunityIcons name="store-off-outline" size={32} color="#94a3b8" />
                <Text style={styles.emptyText}>No hay recomendaciones disponibles.</Text>
              </View>
            )}

            {!loading && recommendations.map((item, index) => {
              const minPrice = getMinPrice(item.professionals);
              const area = getArea(item.address);
              const categoryName = item.categories?.[0]?.name;
              const isPrimary = index === 0;
              const isFav = favorites.includes(item._id);

              return (
                <View key={item._id} style={styles.card}>
                  {item.logo ? (
                    <ImageBackground
                      source={{ uri: item.logo }}
                      style={styles.cardImage}
                      imageStyle={styles.cardImageStyle}
                      resizeMode="cover"
                    >
                      <TouchableOpacity
                        style={styles.favoriteBtn}
                        onPress={() => toggleFavorite(item._id)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name={isFav ? "heart" : "heart-outline"}
                          size={20}
                          color={isFav ? PRIMARY : "#ffffff"}
                        />
                      </TouchableOpacity>
                    </ImageBackground>
                  ) : (
                    <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                      <MaterialCommunityIcons name="store" size={40} color="#e2e8f0" />
                      <TouchableOpacity
                        style={styles.favoriteBtn}
                        onPress={() => toggleFavorite(item._id)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name={isFav ? "heart" : "heart-outline"}
                          size={20}
                          color={isFav ? PRIMARY : "#94a3b8"}
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.cardContent}>
                    <View style={styles.cardTopRow}>
                      {categoryName && (
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{categoryName}</Text>
                        </View>
                      )}
                      <Text style={styles.cardType}>{item.denomination}</Text>
                    </View>

                    <Text style={styles.cardName}>{item.name}</Text>

                    {area ? (
                      <View style={styles.locationRow}>
                        <MaterialCommunityIcons name="map-marker" size={14} color="#94a3b8" />
                        <Text style={styles.locationDetail}>{area}</Text>
                      </View>
                    ) : null}

                    <View style={styles.cardFooter}>
                      <View>
                        {minPrice !== null ? (
                          <>
                            <Text style={styles.priceLabel}>Desde</Text>
                            <Text style={styles.price}>
                              ${minPrice}{" "}
                              <Text style={styles.priceCurrency}>MXN</Text>
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.priceLabel}>Consultar precio</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[styles.reserveBtn, isPrimary && styles.reserveBtnPrimary]}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.reserveText, isPrimary && styles.reserveTextPrimary]}>
                          Reservar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* ── AI Assistant tab ── */}
      {activeTab === "ai" && <AiAssistantScreen />}

      {/* ── Bottom nav ── */}
      <View style={styles.bottomNav}>
        {NAV_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.85}
            >
              <Animated.Image
                source={tab.icon}
                style={[
                  styles.navIcon,
                  {
                    tintColor: active ? "#ffffff" : "#9ca3af",
                    transform: [{ scale: scaleAnims[tab.id] }],
                  },
                ]}
              />
              {active && <Text style={styles.navLabel}>{tab.label}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const PRIMARY = "#FF3B3B";
const LILAC = "#c4b5fd";
const LILAC_DARK = "#8b5cf6";
const TEXT_MAIN = "#1A1A1A";
const TEXT_SEC = "#6b7280";

const WINDOW_HEIGHT = Dimensions.get("window").height;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    ...(Platform.OS === "web" ? { height: WINDOW_HEIGHT, overflow: "hidden" } : {}),
  },

  /* Top bar – siempre visible */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  /* Sub-header: search + tabs */
  subHeader: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  locationText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: TEXT_MAIN,
    maxWidth: 120,
  },

  /* Search */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: TEXT_MAIN,
    height: "100%",
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: `${PRIMARY}15`,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Category tabs */
  tabsContent: {
    gap: 8,
    paddingVertical: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  tabActive: {
    backgroundColor: TEXT_MAIN,
    borderColor: TEXT_MAIN,
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: TEXT_MAIN,
  },
  tabLabelActive: {
    color: "#ffffff",
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },

  /* Section header */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: TEXT_MAIN,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: PRIMARY,
  },

  /* Card */
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardImage: {
    height: 192,
    justifyContent: "space-between",
    flexDirection: "row",
    padding: 12,
  },
  cardImageStyle: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cardImagePlaceholder: {
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  ratingText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: TEXT_MAIN,
  },
  favoriteBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  cardContent: {
    padding: 16,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  cardType: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: TEXT_SEC,
  },
  cardName: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: TEXT_MAIN,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationDetail: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: "#94a3b8",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: TEXT_SEC,
  },
  price: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: TEXT_MAIN,
  },
  priceCurrency: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: TEXT_SEC,
  },
  reserveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: `${LILAC}33`,
  },
  reserveBtnPrimary: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  reserveText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: LILAC_DARK,
  },
  reserveTextPrimary: {
    color: "#ffffff",
  },

  /* Bottom nav */
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#ffffff",
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    minWidth: 48,
  },
  navItemActive: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: PRIMARY,
  },
  navIcon: {
    width: 22,
    height: 22,
  },
  navLabel: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: "#ffffff",
  },
});
