const path = require("path");

var applessLocal = {
  devtool: "source-map",
  entry: "./js/browser/index.js",
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




var applessMobile = {
  devtool: "source-map",
  entry: "./js/mobile/index.js",
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

module.exports = [applessMobile, applessLocal];
