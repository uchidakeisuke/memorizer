import { BrowserWindow, Menu, app, globalShortcut, shell } from "electron";
import defaultMenu from "electron-default-menu";
import { join } from "path";
import "reflect-metadata";

import { getValue, setValue } from "../shared/local_store";
import { ipcMainInit } from "./ipc/ipc_main";
import { dataSource } from "./typeorm";

const width = getValue("width", 460);
const height = getValue("height", 700);
const x = getValue("x", 0);
const y = getValue("y", 0);
const alwaysOnTop = getValue("alwaysOnTop", false);

let mainWindow: BrowserWindow;
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        minWidth: 400,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true,
        },
    });

    mainWindow.loadFile(join(__dirname, "./index.html"));
    mainWindow.setAlwaysOnTop(alwaysOnTop);
    mainWindow.setPosition(x, y);

    const MODE = process.env.MODE;
    if (MODE === "development") mainWindow.webContents.openDevTools();
};

const menu = defaultMenu(app, shell);
menu.push({
    label: "Memorizer",
    submenu: [
        {
            label: "Open Add Term",
            accelerator:
                process.platform === "darwin" ? "Shift+Cmd+N" : "Shift+Ctrl+N",
            click: () => {
                mainWindow.webContents.send("openAddTerm");
            },
        },
    ],
});
Menu.setApplicationMenu(Menu.buildFromTemplate(menu));

app.whenReady().then(async () => {
    globalShortcut.register("insert", () => {
        mainWindow.show();
        mainWindow.webContents.send("openAddTerm");
    });

    createWindow();
    await dataSource.initialize();
    ipcMainInit(mainWindow);

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    app.quit();
});

app.on("before-quit", () => {
    const position = mainWindow.getPosition();
    setValue("x", position[0]);
    setValue("y", position[1]);
});
