var path = require("path");
var HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");


module.exports = {
    entry: {
        app: ["./app/App.jsx"]
    },
    output: {
        path: path.resolve(__dirname, "docs"),
        publicPath: "",
        filename: "bundle.js"
    },
    plugins: [new HtmlWebpackPlugin({
        title: 'Test App',
        template: 'index.tmpl.html'
    }), new ExtractTextPlugin("app.css")]
    ,
    module: {
        rules: [
            {
                test: /\.(jsx|js)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['es2015', 'react', 'stage-3']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader"
                })
            },
            {
                test: /\.(jpg|png|svg)$/,
                loader: 'file-loader',
                options: {
                    name: './images/[name].[ext]',
                }
            },
            {
                test: /.(woff|woff2)$/,
                loader:"url-loader?prefix=font/&limit=5000"
            }
        ]
    },
    devServer: {
        port: 3443,
        https: true
    }
};