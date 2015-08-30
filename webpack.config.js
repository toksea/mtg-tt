var BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = {
  entry: "./fe/main.js",
  output: {
    path: './public',
    filename: "build.js"
  },
  module: {
    loaders: [
      { test: /\.vue$/, loader: "vue-loader" },
      { test: /\.css$/, loader: "style!css" }
    ]
  },
  devtool: '#source-map',
  plugins: [
    new BrowserSyncPlugin({
       host: 'localhost',
       port: 3000,
       server: { baseDir: ['.'] }
    })
  ]
}
