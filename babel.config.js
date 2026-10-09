// Expo's default Babel setup, plus inlining .sql files so Drizzle migrations ship inside the app bundle.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
