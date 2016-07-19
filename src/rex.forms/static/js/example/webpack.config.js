module.exports = {
  entry: [
    'react-hot-loader/patch',
    './index.js',
  ],
  output: {
    path: __dirname,
    filename: 'bundle.js',
  },
  devtool: 'cheap-module-eval-source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['prometheusresearch'],
          plugins: ['react-hot-loader/babel']
        },
      },
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader'],
      },
      {
        test: /\.json/,
        loaders: ['json-loader'],
      },
    ]
  }
};
