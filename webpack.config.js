const path = require("path");
const webpack = require("webpack");
module.exports = {
  mode: "production",
  output: {
    path: path.resolve(__dirname, "dist/static/javascript"),
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
  ],
  resolve: {
    fallback: {
      buffer: require.resolve("buffer"),
    },
  },
};
