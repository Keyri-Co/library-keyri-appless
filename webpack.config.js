const path = require("path");

const applessLocal = {
  devtool: "source-map",
  entry: "./src/js/browser/index.js",
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
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};

const applessMobile = {
  devtool: "source-map",
  entry: "./src/js/mobile/index.js",
  mode: "production",
  output: {
    filename: "appless-mobile.min.js",
    path: path.resolve(__dirname, "dist"),
    pathinfo: true,
    sourceMapFilename: "appless-mobile.min.js.map",
    library: "ApplessMobile",
    libraryTarget: "window",
    libraryExport: "default"
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};

const allInOne = {
  devtool: "source-map",
  entry: "./src/index.js",
  mode: "production",
  output: {
    filename: "index.min.js",
    path: path.resolve(__dirname, "dist"),
    pathinfo: true,
    sourceMapFilename: "index.min.js.map",
    library: "Appless",
    libraryTarget: "umd",
    globalObject: 'this'
  },
  optimization: {
    minimize: false
 },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};

module.exports = [applessMobile, applessLocal, allInOne];
