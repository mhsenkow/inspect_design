import CopyPlugin from "copy-webpack-plugin";

export default {
  webpack: (config, { webpack, dev }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
      }),
    );

    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: "node_modules/bootstrap/dist/js/bootstrap.bundle.js",
            to: "../public/",
          },
        ],
      }),
    );

    return config;
  },
  pageExtensions: ["ts", "tsx"],
  experimental: {
    forceSwcTransforms: true,
  },
  images: {
    unoptimized: true,
  },
  productionBrowserSourceMaps: true,
  serverExternalPackages: ["knex"],
};
