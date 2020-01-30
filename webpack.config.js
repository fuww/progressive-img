module.exports = {
  mode: 'production',
  entry: {
    [`progressive-img${process.env.MODERN ? '.module' : ''}`]: './progressive-img.js'
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env',
              process.env.MODERN ?
                {
                  targets: { esmodules: true }
                } :
                { targets: '> 1%, ie 11' }
            ]]
          }
        }
      }
    ]
  },
  output: {
    publicPath: 'dist',
    filename: '[name].js'
  }
}
