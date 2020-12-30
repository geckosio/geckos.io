const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')

/**
 * Make the minified bundle of the client lib
 */
module.exports = env => {
  return {
    mode: 'production',
    entry: path.resolve(__dirname, '../src/bundle.ts'),
    output: {
      path: path.resolve(__dirname, `${env.path}`),
      filename: `geckos.io-client.${env.packageVersion}.min.js`,
      library: 'geckos',
      libraryExport: 'default'
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            output: {
              comments: false
            }
          },
          extractComments: false
        })
      ]
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
