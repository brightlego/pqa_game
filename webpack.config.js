const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const levelBuild = require("./scripts/level-build")

module.exports = {
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif|wav)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.json$/i,
                type: 'asset'
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist'),
        assetModuleFilename: "assets/[hash]-[name][ext][query]",
        clean: true
    },
    plugins: [
        {
            apply: (compiler) => {
                compiler.hooks.compile.tap("LevelsCompile", () => levelBuild.buildLevels(__dirname, compiler));
            }
        },
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src", "assets", "index.html"),
            filename: "index.html",
            minify: true,
        }),
        new MiniCssExtractPlugin({
            "filename": "style.css"
        }),
    ]
};