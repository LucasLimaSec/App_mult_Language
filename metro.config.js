const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Migrations do Drizzle são arquivos .sql empacotados no app.
config.resolver.sourceExts.push('sql');

module.exports = withNativeWind(config, { input: './global.css' });
