const path = require("path");

var applessLocal = {
  devtool: "source-map",
  entry: "./js/appless-local.js",
  mode: "production",
  output: {
    filename: "appless-local.min.js",
    path: path.resolve(__dirname, "dist"),
    pathinfo: true,
    sourceMapFilename: "appless-local.min.js.map",
    library: "LocalAppless",
    libraryTarget: "window",
    libraryExport: "default",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};


module.exports = [connector, applessMobile, applessLocal, qrWorker];
