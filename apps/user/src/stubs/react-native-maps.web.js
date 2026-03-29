// Stub for react-native-maps on web — the .web.tsx platform files handle this platform.
const React = require("react");
const { View } = require("react-native");

const MapView = (props) => React.createElement(View, props);
MapView.displayName = "MapView";

const Marker = (props) => React.createElement(View, props);
Marker.displayName = "Marker";

module.exports = MapView;
module.exports.default = MapView;
module.exports.MapView = MapView;
module.exports.Marker = Marker;
module.exports.PROVIDER_GOOGLE = "google";
module.exports.PROVIDER_DEFAULT = "default";
