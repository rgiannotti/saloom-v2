import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as ExpoLocation from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import MapView, { Marker, Region } from "react-native-maps";

import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL, GOOGLE_MAPS_API_KEY as GOOGLE_MAPS_KEY } from "../config";
import { fonts } from "../theme/fonts";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PickedLocation {
  latitude: number;
  longitude: number;
  address: string;
  zone: string; // comunity / neighborhood
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (location: PickedLocation) => void;
  initialLatitude?: number;
  initialLongitude?: number;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapStore {
  _id: string;
  name: string;
  location: { coordinates: [number, number] }; // [lng, lat]
  logo?: string;
  coverImage?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIMARY = "#FF3B3B";
const TEXT_MAIN = "#1A1A1A";
const TEXT_SEC = "#6b7280";

const FALLBACK_LAT = 19.4284;
const FALLBACK_LNG = -99.1276;

const DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 };

const MAP_STYLE = [
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ visibility: "on" }, { color: "#d8f0d8" }] },
  { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] }
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ address: string; zone: string }> {
  try {
    const results = await ExpoLocation.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (results.length > 0) {
      const r = results[0];
      const parts = [r.street, r.streetNumber].filter(Boolean).join(" ");
      const address = [parts, r.district ?? r.subregion ?? r.city].filter(Boolean).join(", ");
      const zone = r.district ?? r.subregion ?? r.city ?? r.region ?? "";
      return { address: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`, zone };
    }
  } catch {
    // ignore
  }
  return { address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, zone: "" };
}

// ─── Component ───────────────────────────────────────────────────────────────

export const LocationPickerScreen = ({
  visible,
  onClose,
  onConfirm,
  initialLatitude,
  initialLongitude
}: Props) => {
  const { session } = useAuth();
  const mapRef = useRef<MapView>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: initialLatitude ?? FALLBACK_LAT,
    longitude: initialLongitude ?? FALLBACK_LNG,
    ...DELTA
  });
  const [pickedAddress, setPickedAddress] = useState("");
  const [pickedZone, setPickedZone] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [stores, setStores] = useState<MapStore[]>([]);

  const fetchStores = useCallback(async (r: Region) => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = r;
    const minLat = latitude - latitudeDelta / 2;
    const maxLat = latitude + latitudeDelta / 2;
    const minLng = longitude - longitudeDelta / 2;
    const maxLng = longitude + longitudeDelta / 2;
    try {
      const res = await fetch(
        `${API_BASE_URL}/app/map/clients?minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}`,
        { headers: { Authorization: `Bearer ${session?.tokens.accessToken}` } }
      );
      if (res.ok) {
        const data: MapStore[] = await res.json();
        setStores(data);
      }
    } catch {
      // ignore fetch errors silently on map
    }
  }, [session?.tokens.accessToken]);

  // When modal opens, try to get GPS position
  useEffect(() => {
    if (!visible) return;

    const init = async () => {
      setGeocoding(true);
      let lat = initialLatitude ?? FALLBACK_LAT;
      let lng = initialLongitude ?? FALLBACK_LNG;

      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }

      const newRegion = { latitude: lat, longitude: lng, ...DELTA };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 400);

      const { address, zone } = await reverseGeocode(lat, lng);
      setPickedAddress(address);
      setPickedZone(zone);
      setGeocoding(false);

      const initialRegion = { latitude: lat, longitude: lng, ...DELTA };
      fetchStores(initialRegion);
    };

    init();
  }, [visible]);

  const moveToCoords = async (lat: number, lng: number) => {
    const newRegion = { latitude: lat, longitude: lng, ...DELTA };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);
    setGeocoding(true);
    const { address, zone } = await reverseGeocode(lat, lng);
    setPickedAddress(address);
    setPickedZone(zone);
    setGeocoding(false);
  };

  const handleRegionChangeComplete = async (r: Region) => {
    setRegion(r);
    setGeocoding(true);
    const { address, zone } = await reverseGeocode(r.latitude, r.longitude);
    setPickedAddress(address);
    setPickedZone(zone);
    setGeocoding(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchStores(r), 400);
  };

  const handleConfirm = () => {
    onConfirm({
      latitude: region.latitude,
      longitude: region.longitude,
      address: pickedAddress,
      zone: pickedZone
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.root}>
        {/* ── Map fills the whole screen ── */}
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider="google"
          initialRegion={region}
          onRegionChangeComplete={handleRegionChangeComplete}
          customMapStyle={MAP_STYLE}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {stores.map((store) => (
            <Marker
              key={store._id}
              coordinate={{
                latitude: store.location.coordinates[1],
                longitude: store.location.coordinates[0]
              }}
              title={store.name}
            >
              <View style={styles.storeMarker}>
                <MaterialCommunityIcons name="store" size={14} color="#ffffff" />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* ── Center pin ── */}
        <View style={styles.pinWrapper} pointerEvents="none">
          <MaterialCommunityIcons name="map-marker" size={44} color={PRIMARY} />
        </View>

        {/* ── Top overlay: back button + search ── */}
        <SafeAreaView style={styles.topOverlay}>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.8}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={TEXT_MAIN} />
            </TouchableOpacity>
            <View style={styles.searchWrapper}>
              <GooglePlacesAutocomplete
                placeholder="Buscar dirección..."
                fetchDetails
                onPress={(data, details) => {
                  if (details?.geometry?.location) {
                    const { lat, lng } = details.geometry.location;
                    moveToCoords(lat, lng);
                  }
                }}
                query={{
                  key: GOOGLE_MAPS_KEY,
                  language: "es"
                }}
                styles={{
                  container: { flex: 0 },
                  textInputContainer: styles.placesInputContainer,
                  textInput: styles.placesInput,
                  listView: styles.placesList,
                  row: styles.placesRow,
                  description: styles.placesRowText,
                  poweredContainer: { display: "none" }
                }}
                renderLeftButton={() => (
                  <MaterialCommunityIcons
                    name="magnify"
                    size={20}
                    color="#94a3b8"
                    style={styles.searchIcon}
                  />
                )}
                enablePoweredByContainer={false}
                keepResultsAfterBlur={false}
              />
            </View>
          </View>
        </SafeAreaView>

        {/* ── Bottom overlay: address label + confirm button ── */}
        <View style={styles.bottomOverlay}>
          <View style={styles.addressCard}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={PRIMARY} />
            <View style={styles.addressTexts}>
              {geocoding ? (
                <ActivityIndicator size="small" color={PRIMARY} />
              ) : (
                <>
                  <Text style={styles.addressMain} numberOfLines={1}>
                    {pickedAddress || "Mueve el mapa para seleccionar"}
                  </Text>
                  {pickedZone ? (
                    <Text style={styles.addressZone} numberOfLines={1}>
                      {pickedZone}
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, geocoding && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            activeOpacity={0.85}
            disabled={geocoding}
          >
            <Text style={styles.confirmText}>Confirmar ubicación</Text>
            <MaterialCommunityIcons name="check" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#e5e5e5"
  },

  // ── Center pin ──
  storeMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  pinWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 44 // offset so the tip of the pin lands at center
  },

  // ── Top overlay ──
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 0
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  searchWrapper: {
    flex: 1
  },
  placesInputContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    height: 48
  },
  placesInput: {
    height: 46,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: TEXT_MAIN,
    backgroundColor: "transparent",
    paddingHorizontal: 4
  },
  placesList: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  placesRow: {
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  placesRowText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: TEXT_MAIN
  },
  searchIcon: {
    alignSelf: "center",
    marginLeft: 4,
    marginRight: 4
  },

  // ── Bottom overlay ──
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
    gap: 16
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  addressTexts: {
    flex: 1,
    gap: 2
  },
  addressMain: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: TEXT_MAIN
  },
  addressZone: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: TEXT_SEC
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: PRIMARY,
    borderRadius: 16,
    height: 52,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  confirmBtnDisabled: {
    opacity: 0.6
  },
  confirmText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: "#ffffff"
  }
});
