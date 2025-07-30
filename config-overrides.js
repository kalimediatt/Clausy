const { override, addBabelPreset, addBabelPlugin } = require('customize-cra');

module.exports = {
  webpack: override(
    addBabelPreset('@babel/preset-env', {
      targets: {
        node: 'current',
      },
    }),
    addBabelPlugin('@babel/plugin-proposal-nullish-coalescing-operator'),
    addBabelPlugin('@babel/plugin-proposal-optional-chaining')
  ),
  devServer: function(configFunction) {
    return function(proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);
      config.host = '0.0.0.0';
      config.port = 3000;
      config.allowedHosts = 'all';
      return config;
    };
  }
}; 