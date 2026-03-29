// Location picker is only available on mobile devices.
export interface PickedLocation {
  latitude: number;
  longitude: number;
  address: string;
  zone: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (location: PickedLocation) => void;
  initialLatitude?: number;
  initialLongitude?: number;
}

export const LocationPickerScreen = (_props: Props) => null;
