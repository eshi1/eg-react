
module.exports = (config, env) => {
    // This should help with typescript source-maps
    config.devtool = 'source-map';

    if (!config.module) {
        config.module = {};
    }
    if (!config.module.rules) {
        config.module.rules = [];
    }

    config.module.rules.push({
        loader: require.resolve('babel-loader'),
        exclude: /node_modules/,
        query: {
          presets: [
            "@babel/preset-typescript",
            "@babel/preset-env",
            "@babel/preset-react"
        ],
          plugins: [
            "@babel/proposal-class-properties",
            "@babel/proposal-object-rest-spread"
        ]
        },
        test: /\.(js|jsx)$/,
    });

    config.module.rules.push({
        test: /\.worker\.js/,
        use: {
            loader: 'worker-loader',
            // options: { inline: true }
        },       
    });

    config.output = {
        ...config.output, globalObject: 'this'
    };
    
    return config;
}
