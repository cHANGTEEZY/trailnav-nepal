const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

// Ensure package "exports" subpaths like @expo/ui/community/* resolve.
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = [
  "require",
  "import",
  "react-native",
  "default",
];

// Support offline MapLibre tile archives (.mbtiles) and Drizzle SQL migrations (.sql).
if (!config.resolver.assetExts.includes("mbtiles")) {
  config.resolver.assetExts.push("mbtiles");
}
if (!config.resolver.sourceExts.includes("sql")) {
  config.resolver.sourceExts.push("sql");
}

const withUniwind = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
  dtsFile: "./src/uniwind-types.d.ts",
});

const previousResolveRequest = withUniwind.resolver.resolveRequest;

withUniwind.resolver.resolveRequest = (context, moduleName, platform) => {
  // Metro occasionally fails on @expo/ui subpath exports; pin the entry.
  if (moduleName === "@expo/ui/community/datetime-picker") {
    return {
      type: "sourceFile",
      filePath: path.resolve(
        __dirname,
        "node_modules/@expo/ui/src/community/datetime-picker/index.tsx",
      ),
    };
  }

  if (typeof previousResolveRequest === "function") {
    return previousResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwind;
