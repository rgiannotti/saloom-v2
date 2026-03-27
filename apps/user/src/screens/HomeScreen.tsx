import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BlurView } from "expo-blur";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  View
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
  location?: { type?: string; coordinates?: [number, number] };
  logo?: string;
  categories: { _id: string; name: string; icon?: string }[];
  professionals: {
    services: { price: number }[];
  }[];
}

interface ServiceCategory {
  _id: string;
  name: string;
  icon: string;
  active: boolean;
}

/** Maps backoffice react-icons/md names → MaterialCommunityIcons names */
const MD_TO_MCI: Record<string, string> = {
  MdContentCut: "content-cut",
  MdSpa: "flower",
  MdFace: "face-man",
  MdFaceRetouchingNatural: "face-woman",
  MdBrush: "brush",
  MdColorLens: "palette",
  MdLocalFlorist: "flower-outline",
  MdFitnessCenter: "dumbbell",
  MdSelfImprovement: "meditation",
  MdAccessibility: "human",
  MdHealthAndSafety: "shield-cross",
  MdMedicalServices: "medical-bag",
  MdLocalHospital: "hospital-building",
  MdNaturePeople: "nature-people",
  MdYard: "tree",
  MdHouse: "home",
  MdCleaningServices: "broom",
  MdPlumbing: "pipe",
  MdElectricalServices: "lightning-bolt",
  MdHandyman: "tools",
  MdBuild: "wrench",
  MdConstruction: "hard-hat",
  MdFormatPaint: "format-paint",
  MdCarpenter: "saw-blade",
  MdOutdoorGrill: "grill",
  MdKitchen: "fridge",
  MdDining: "food-fork-drink",
  MdLocalCafe: "coffee",
  MdLocalDining: "silverware-fork-knife",
  MdPets: "paw",
  MdDirectionsCar: "car",
  MdCarRepair: "car-wrench",
  MdLocalCarWash: "car-wash",
  MdPhotoCamera: "camera",
  MdVideocam: "video",
  MdMusicNote: "music-note",
  MdSchool: "school",
  MdMenuBook: "book-open-variant",
  MdComputer: "monitor",
  MdPhoneIphone: "cellphone",
  MdDesignServices: "palette-swatch",
  MdBusinessCenter: "briefcase",
  MdAccountBalance: "bank",
  MdGavel: "gavel",
  MdLocalShipping: "truck-delivery",
  MdFlight: "airplane",
  MdHotel: "bed",
  MdSportsEsports: "gamepad-variant",
  MdSportsTennis: "tennis",
  MdSportsFootball: "soccer",
  MdSportsMartialArts: "karate",
  MdPool: "pool",
  MdStar: "star",
  MdFavorite: "heart",
  MdCategory: "shape"
};

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

const getDistance = (
  userLat: number,
  userLng: number,
  coords?: [number, number]
): string | null => {
  if (!coords || coords.length < 2) return null;
  const [storeLng, storeLat] = coords; // GeoJSON: [lng, lat]
  const R = 6371;
  const dLat = ((storeLat - userLat) * Math.PI) / 180;
  const dLng = ((storeLng - userLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((storeLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

// ─── Component ───────────────────────────────────────────────────────────────

type TabId = "explore" | "map" | "ai" | "menu";

const NAV_TABS: { id: TabId; label: string; icon: ReturnType<typeof require> }[] = [
  { id: "explore", label: "Explorar", icon: require("../../assets/icons/home.png") },
  { id: "map", label: "Mapa", icon: require("../../assets/icons/map.png") },
  { id: "ai", label: "Asistente IA", icon: require("../../assets/icons/ai.png") },
  { id: "menu", label: "Menú", icon: require("../../assets/icons/menu.png") }
];

export const HomeScreen = () => {
  const { logout, session } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("explore");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const scaleAnims = useRef(
    NAV_TABS.reduce<Record<TabId, Animated.Value>>(
      (acc, tab) => {
        acc[tab.id] = new Animated.Value(1);
        return acc;
      },
      {} as Record<TabId, Animated.Value>
    )
  ).current;

  const handleTabPress = (id: TabId) => {
    LayoutAnimation.configureNext({
      duration: 280,
      create: { type: "spring", property: "scaleXY", springDamping: 0.75 },
      update: { type: "spring", springDamping: 0.75 },
      delete: { type: "spring", property: "scaleXY", springDamping: 0.75 }
    });
    Animated.sequence([
      Animated.timing(scaleAnims[id], {
        toValue: 1.3,
        duration: 90,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnims[id], {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true
      })
    ]).start();
    setActiveTab(id);
  };
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState("Mi ubicación");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: FALLBACK_LAT,
    lng: FALLBACK_LNG
  });

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // Unique categories present across all loaded recommendations, preserving order of first appearance
  const availableCategories = useMemo(() => {
    const seen = new Set<string>();
    const result: ServiceCategory[] = [];
    for (const item of recommendations) {
      for (const cat of item.categories) {
        if (!seen.has(cat._id)) {
          seen.add(cat._id);
          result.push({ _id: cat._id, name: cat.name, icon: cat.icon ?? "", active: true });
        }
      }
    }
    return result;
  }, [recommendations]);

  const filteredRecommendations = recommendations.filter((item) =>
    item.categories.some((cat) => selectedCategories.includes(cat._id))
  );

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
            accuracy: Location.Accuracy.Balanced
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
          setLocationLabel("Mi ubicación");
        }

        const res = await fetch(
          `${API_BASE_URL}/app/recommendations?lat=${lat}&lng=${lng}&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${session?.tokens.accessToken}`
            }
          }
        );
        if (!res.ok) throw new Error("No se pudieron cargar los recomendados.");
        const data: Recommendation[] = await res.json();
        setRecommendations(data);
        const allIds = [
          ...new Set(data.flatMap((item) => item.categories.map((c) => c._id)))
        ];
        setSelectedCategories(allIds);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar recomendaciones.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [session?.tokens.accessToken]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
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
              <Text style={styles.locationText} numberOfLines={1}>
                {locationLabel}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Sub-header: search + tabs */}
          <View style={styles.subHeader}>
            <View style={styles.searchBar}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#94a3b8"
                style={styles.searchIcon}
              />
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
              {availableCategories.map((cat) => {
                  const active = selectedCategories.includes(cat._id);
                  return (
                    <TouchableOpacity
                      key={cat._id}
                      style={[styles.tab, active && styles.tabActive]}
                      onPress={() => toggleCategory(cat._id)}
                      activeOpacity={0.8}
                    >
                      {cat.icon && MD_TO_MCI[cat.icon] ? (
                        <MaterialCommunityIcons
                          name={MD_TO_MCI[cat.icon] as any}
                          size={16}
                          color={active ? "#ffffff" : "#1A1A1A"}
                        />
                      ) : null}
                      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                        {cat.name}
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

            {!loading && !error && filteredRecommendations.length === 0 && (
              <View style={styles.centered}>
                <MaterialCommunityIcons name="store-off-outline" size={32} color="#94a3b8" />
                <Text style={styles.emptyText}>
                  {recommendations.length === 0
                    ? "No hay recomendaciones disponibles."
                    : "Sin resultados para las categorías seleccionadas."}
                </Text>
              </View>
            )}

            {!loading &&
              filteredRecommendations.map((item, index) => {
                const minPrice = getMinPrice(item.professionals);
                const distance = getDistance(userCoords.lat, userCoords.lng, item.location?.coordinates);
                const area = getArea(item.address);
                const locationText = [distance, area].filter(Boolean).join(" · ");
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
                      {item.categories && item.categories.length > 0 && (
                        <View style={styles.cardTopRow}>
                          {item.categories.map((cat, i) => (
                            <View key={i} style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText}>{cat.name}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <Text style={styles.cardName}>{item.name}</Text>

                      {locationText ? (
                        <View style={styles.locationRow}>
                          <MaterialCommunityIcons name="map-marker" size={14} color="#94a3b8" />
                          <Text style={styles.locationDetail}>{locationText}</Text>
                        </View>
                      ) : null}

                      <View style={styles.cardFooter}>
                        <View>
                          {minPrice !== null ? (
                            <>
                              <Text style={styles.priceLabel}>Desde</Text>
                              <Text style={styles.price}>
                                ${minPrice} <Text style={styles.priceCurrency}>Ref.</Text>
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
                          <Text
                            style={[styles.reserveText, isPrimary && styles.reserveTextPrimary]}
                          >
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

      {/* ── Bottom nav – liquid glass ── */}
      <View style={styles.bottomNavOuter}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={75} tint="light" style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={styles.bottomNavInner}>
          {NAV_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.navItem}
                onPress={() => handleTabPress(tab.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
                  {active && Platform.OS === "ios" ? (
                    <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
                  ) : null}
                  <Animated.Image
                    source={tab.icon}
                    style={[
                      styles.navIcon,
                      {
                        tintColor: active ? PRIMARY : "#9ca3af",
                        transform: [{ scale: scaleAnims[tab.id] }]
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
    ...(Platform.OS === "web" ? { height: WINDOW_HEIGHT, overflow: "hidden" } : {})
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
    borderBottomColor: "#f3f4f6"
  },

  /* Sub-header: search + tabs */
  subHeader: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6"
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
    borderColor: "#e2e8f0"
  },
  locationText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: TEXT_MAIN,
    maxWidth: 120
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
    elevation: 1
  },
  searchIcon: {
    flexShrink: 0
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: TEXT_MAIN,
    height: "100%",
    ...Platform.select({ web: { outlineWidth: 0 } })
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: `${PRIMARY}15`,
    alignItems: "center",
    justifyContent: "center"
  },

  /* Category tabs */
  tabsContent: {
    gap: 8,
    paddingVertical: 4
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
    backgroundColor: "#ffffff"
  },
  tabActive: {
    backgroundColor: TEXT_MAIN,
    borderColor: TEXT_MAIN
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: TEXT_MAIN
  },
  tabLabelActive: {
    color: "#ffffff"
  },

  /* Scroll */
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 112,
    gap: 16
  },

  /* Section header */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: TEXT_MAIN
  },
  seeAll: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: PRIMARY
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
    elevation: 2
  },
  cardImage: {
    height: 192,
    justifyContent: "space-between",
    flexDirection: "row",
    padding: 12
  },
  cardImageStyle: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24
  },
  cardImagePlaceholder: {
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start"
  },
  ratingText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: TEXT_MAIN
  },
  favoriteBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start"
  },
  cardContent: {
    padding: 16,
    gap: 6
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  categoryBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: `${LILAC}33`
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: LILAC_DARK
  },
  cardType: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: TEXT_SEC
  },
  cardName: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: TEXT_MAIN,
    lineHeight: 22
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  locationDetail: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: "#94a3b8"
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8
  },
  priceLabel: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: TEXT_SEC
  },
  price: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: TEXT_MAIN
  },
  priceCurrency: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: TEXT_SEC
  },
  reserveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: `${LILAC}33`
  },
  reserveBtnPrimary: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3
  },
  reserveText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: LILAC_DARK
  },
  reserveTextPrimary: {
    color: "#ffffff"
  },

  /* Bottom nav – liquid glass */
  bottomNavOuter: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor:
      Platform.OS === "android" || Platform.OS === "web"
        ? "rgba(255,255,255,0.96)"
        : "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14
  },
  bottomNavInner: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 2,
    paddingBottom: 2,
    paddingHorizontal: 2
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 0
  },
  navIconWrap: {
    width: 40,
    height: 26,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  navIconWrapActive: {
    backgroundColor: Platform.OS === "android" ? `${PRIMARY}18` : "rgba(255,255,255,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)"
  },
  navIcon: {
    width: 22,
    height: 22
  },
  navLabel: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: "#9ca3af"
  },
  navLabelActive: {
    color: PRIMARY
  },

  /* States */
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: TEXT_SEC,
    textAlign: "center"
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: TEXT_SEC,
    textAlign: "center"
  }
});
