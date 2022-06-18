const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
    entry: "./app/main.ts",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "main.js",
    },
    devtool: "source-map",
    target: "electron-main",
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.(js|ts)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                    },
                },
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: "ts-loader",
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        // new CopyPlugin({
        //     patterns: [
        //         {
        //             from: "./package.json",
        //             to: path.resolve(__dirname, "dist"),
        //         },
        //     ],
        // }),
    ],
    externals: {
        sqlite3: "commonjs sqlite3",
    },
    optimization: {
        minimize: false,
    },
};
