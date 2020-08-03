const {
  merge
} = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: path.resolve(__dirname, 'dist/ui'),
    compress: true,
    host: '0.0.0.0',
    port: 8090
  }
});
