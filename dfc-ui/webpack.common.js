const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const Visualizer = require('webpack-visualizer-plugin2');
const CompressionPlugin = require('compression-webpack-plugin');
module.exports = {
  entry: [
    '@babel/polyfill', 'jquery', './src/ui/main.js'
  ],
  // entry: {
  //   vendor: [
  //     '@babel/polyfill',
  //     'jquery'
  //   ],
  //   app: [
  //     './src/main.js',
  //   ]
  // },
  output: {
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js',
    path: path.resolve(__dirname, 'dist/ui')
  },
  optimization: {
    runtimeChunk: 'single',
    minimize: true,
    mergeDuplicateChunks: true,
    splitChunks: {
      chunks: 'all'
    },
  },
  module: {
    rules: [{
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {}
        }
      }, {
        test: /\.html$/,
        include: [
          path.resolve(__dirname, "app/components")
        ],
        use: {
          loader: 'html-loader',
          options: {}
        }
      },
      {
        test: /\.(css|scss)/,
        use: [{
          loader: 'css-loader',
          options: {}
        }]
      },


      {
        test: /\.(png|jpe?g|gif|woff(2)?|ttf)$/,
        use: [{
          loader: 'file-loader',
          options: {},
        }],
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new HtmlWebpackPlugin({
      inject: false,
      template: 'src/ui/index.html'
    }),
    new Visualizer({
      filename: './statistics.html'
    }),
    new webpack.DefinePlugin({
      'url_server': JSON.stringify(process.env.URL_SERVER)||JSON.stringify('http://localhost:8080')
    })
  ]
};
