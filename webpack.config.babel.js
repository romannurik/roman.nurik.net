import process from 'process';
import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';

const stats = {
  modules: false,
  children: false,
  colors: true,
};

module.exports = {
  entry: {
    app: './app/app.entry.js',
  },
  stats,
  devServer: {
    contentBase: path.resolve(process.cwd(), 'dist'),
    compress: true,
    port: 3000,
    open: true,
    writeToDisk: true,
    watchContentBase: true,
    stats,
  },
  output: {
    filename: '[name].js',
    path: path.resolve(process.cwd(), 'dist'),
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    new CopyPlugin([
      {from: 'app/media', to: 'media'},
      {from: 'app/images', to: 'images'},
      {from: 'app/CNAME', to: ''},
      {from: '*.{txt,ico,png}', context: 'app', to: ''},
    ]),
  ],
  performance: {
    hints: false,
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          chunks: 'initial',
          name: 'vendor',
          enforce: true,
        },
      }
    },
  },
  module: {
    rules: [
      // JS
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.yaml$/,
        use: [
          'json-loader',
          'yaml-loader',
        ]
      },
      // Scoped CSS, 
      {
        test: /\.lit\.scss?$/,
        use: [
          'to-string-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ]
      },
      // CSS
      {
        test: /(?<!lit)\.scss?$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: false,
            },
          },
          'postcss-loader',
          'sass-loader',
        ]
      },
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.yaml', '.scss'],
    alias: {
      '@app': path.resolve(__dirname, 'app/'),
    }
  },
};
