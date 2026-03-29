const createExpoWebpackConfigAsync = require("@expo/webpack-config");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Stub out react-native-maps on web (native-only module)
  config.resolve.alias["react-native-maps"] = require.resolve(
    "./src/stubs/react-native-maps.web.js"
  );

  return config;
};
