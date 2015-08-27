module.exports = {
  entry: "./fe/main.js",
  output: {
    path: './build',
    filename: "build.js"
  },
  module: {
    loaders: [
      { test: /\.vue$/, loader: "vue-loader" },
      { test: /\.css$/, loader: "style!css" }
    ]
  },
  devtool: '#source-map'
}
