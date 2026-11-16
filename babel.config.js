module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // Permite importar os arquivos .sql das migrations do Drizzle como texto.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
