const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('siddur');
config.resolver.blockList = [...config.resolver.blockList, /[\\/]\.claude[\\/]/];

module.exports = config;
