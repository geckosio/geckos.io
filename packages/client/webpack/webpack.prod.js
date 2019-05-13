const path = require('path')

/**
 * Make the minified bundle of the client lib
 */
module.exports = (env, argv) => {
  return {
    mode: 'production',
    entry: path.resolve(__dirname, '../src/bundle.ts'),
    output: {
      path: path.resolve(__dirname, `${argv.path}`),
      filename: `geckos.io-client.${argv.packageVersion}.min.js`,
      library: 'geckos',
      libraryExport: 'default'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js']
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader'
        }
      ]
    }
  }
}
