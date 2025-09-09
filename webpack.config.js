const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

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
                compiler.hooks.compile.tap("LevelsCompile", () => {
                    let dataDir = path.resolve(__dirname, "data");
                    let levelsDir = path.resolve(__dirname, "data", "levels");
                    let distDir = path.resolve(__dirname, "src", "assets");

                    if (!fs.existsSync(distDir)) {
                        fs.mkdirSync(distDir);
                    }

                    let levels =  fs.readdirSync(levelsDir)

                    let resultingObj = {levels: []};
                    for (let level of levels) {
                        let levelData = fs.readFileSync(path.resolve(levelsDir, level), "utf-8");
                        resultingObj.levels.push(JSON.parse(levelData));
                    }

                    let groups = fs.readFileSync(path.resolve(dataDir, "groups.json"), "utf-8");
                    resultingObj.groups = JSON.parse(groups);

                    fs.writeFileSync(path.resolve(distDir, "levels.json"), JSON.stringify(resultingObj));
                    console.log(`${levels.length} levels written to ${distDir}/levels.json`)
                });
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