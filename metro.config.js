// Expo's default Metro setup, plus .sql as a source file type for Drizzle migrations.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('sql');

module.exports = config;
