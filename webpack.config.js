import process from 'process';
import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

module.exports = {
  entry: {
    app: './app/app.entry.js',
  },
  output: {
    filename: '[name].js',
    path: path.join(process.cwd(), './dist'),
  },
  plugins: [
    new MiniCssExtractPlugin({filename: '[name].css'})
  ],
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.(jsx?|scss)/,
        use: 'import-glob',
      },
      // JS
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            }
          },
        ]
      },
      {
        test: /\.yaml$/,
        use: [
          'json-loader',
          'yaml-loader',
        ]
      },
      // CSS
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: false,
            },
          },
          {
            loader: 'postcss-loader',
          },
          {
            loader: 'sass-loader',
          },
        ]
      },
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.yaml', '.scss']
  },
};
