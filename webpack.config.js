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
