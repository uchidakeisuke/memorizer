/* eslint-disable */
const path = require("path");
const { DefinePlugin } = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { argv } = require("process");

module.exports = (env, argv) => {
    return {
        mode: argv.mode,
        entry: "./interface/index.tsx",
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "index.js",
        },
        devtool: "source-map",
        target: "electron-renderer",
        resolve: {
            extensions: [".ts", ".tsx", ".js"],
        },
        module: {
            rules: [
                {
                    test: /\.(js|ts|tsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env"],
                        },
                    },
                },
                {
                    test: /\.(ts|tsx)$/,
                    exclude: /node_modules/,
                    use: "ts-loader",
                },
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader", "postcss-loader"],
                },
                {
                    test: /\.scss$/,
                    use: ["style-loader", "css-loader", "sass-loader"],
                },
                {
                    test: /\.(png|jpe?g|gif|webp)$/,
                    use: [
                        {
                            loader: "file-loader",
                        },
                    ],
                },
            ],
        },
        plugins: [
            new DefinePlugin({
                "process.env.MODE": JSON.stringify(argv.mode),
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: "./interface/index.html",
                        to: path.resolve(__dirname, "dist"),
                    },
                    {
                        from: "./interface/index.css",
                        to: path.resolve(__dirname, "dist"),
                    },
                ],
            }),
        ],
        optimization: {
            minimize: false,
        },
    };
};
