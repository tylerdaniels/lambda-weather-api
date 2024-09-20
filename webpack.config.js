module.exports = (options, webpack) => {
  const lazyImports = [
    // Required imports for Lambda handlers
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets/socket-module',
  ];

  return {
    ...options,
    externals: [],
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          if (lazyImports.includes(resource)) {
            try {
              require.resolve(resource);
            } catch {
              return true;
            }
          }
          return false;
        },
      }),
    ],
    output: {
      ...options.output,
      libraryTarget: 'commonjs2',
    },
  };
};
