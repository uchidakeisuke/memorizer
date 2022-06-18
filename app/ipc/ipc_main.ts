import { BrowserWindow, ipcMain, shell } from "electron";
import { download } from "electron-dl";

import {
    createTerm,
    deleteTerms,
    getAllTags,
    getAllTerms,
    getTargetTerms,
    getTermById,
    getTermByIds,
    updateStatus,
    updateSuspend,
    updateTerm,
} from "../services/term";
import { devDbPath } from "../typeorm";
import { Term } from "../typeorm/entities";
import {
    AddTermRequest,
    DeleteTermsRequest,
    GetTargetTermsRequest,
    GetTermRequest,
    OpenDictionaryRequest,
    UpdateStatusAndSuspendRequest,
    UpdateTermRequest,
} from "./request";
import { AddTermResponse } from "./response";

const ipcMainSend = <T>(
    event: Electron.IpcMainEvent,
    channel: string,
    data: T
) => {
    event.sender.send(channel, data);
};

const ipcMainAddTerm = async () => {
    ipcMain.on("addTerm", async (event, args: AddTermRequest) => {
        try {
            const data = args.data;
            const createdTerm = await createTerm({
                term: data.term,
                note: data.note,
                videos: data.videos,
                tags: data.tags,
            });
            const termId = createdTerm.term.identifiers.length
                ? createdTerm.term.identifiers[0].id
                : null;

            let term: Term | null = null;
            if (termId && typeof termId === "number") {
                term = await getTermById(termId);
                ipcMainSend<AddTermResponse>(event, "didAddTerm", {
                    result: Boolean(term),
                    data: term,
                });
            } else {
                ipcMainSend<AddTermResponse>(event, "didAddTerm", {
                    result: false,
                    data: null,
                });
            }
        } catch (error) {
            ipcMainSend<AddTermResponse>(event, "didAddTerm", {
                result: false,
                data: null,
            });
        }
    });
};

const ipcMainGetTerm = async () => {
    ipcMain.on("getTerm", async (event, args: GetTermRequest) => {
        try {
            const data = args.data;
            const termId = data.id;

            let term: Term | null = null;
            if (termId && typeof termId === "number") {
                term = await getTermById(termId);
            } else {
                event.sender.send("didGetTerm", { result: true, data: null });
            }
            event.sender.send("didGetTerm", {
                result: Boolean(term),
                data: term,
            });
        } catch (error) {
            event.sender.send("didAddTerm", { result: false, data: null });
        }
    });
};

const ipcMainUpdateTerm = async () => {
    ipcMain.on("updateTerm", async (event, args: UpdateTermRequest) => {
        try {
            const data = args.data;
            await updateTerm({
                id: data.id,
                term: data.term,
                note: data.note,
                videos: data.videos,
                tags: data.tags,
            });
            const term = await getTermById(data.id);
            event.sender.send("didUpdateTerm", {
                result: Boolean(term),
                data: term,
            });
        } catch (error) {
            event.sender.send("didAddTerm", { result: false, data: null });
        }
    });
};

const ipcMainGetAllTerms = async () => {
    ipcMain.on("getAllTerms", async (event) => {
        try {
            const allTerms = await getAllTerms();
            event.sender.send("didGetAllTerms", {
                result: true,
                data: allTerms,
            });
        } catch (error) {
            event.sender.send("didGetAllTerms", { result: false, data: null });
        }
    });
};

const ipcMainDeleteTerms = async () => {
    ipcMain.on("deleteTerms", async (event, args: DeleteTermsRequest) => {
        try {
            const data = args.data;
            const ids = data.ids;
            await deleteTerms(ids);
            const terms = await getTermByIds(ids);
            if (!terms || !terms.length) {
                event.sender.send("didDeleteTerms", { result: true });
            } else {
                event.sender.send("didDeleteTerms", { result: false });
            }
        } catch (error) {
            event.sender.send("didDeleteTerms", { result: false });
        }
    });
};

const ipcMainGetAllTags = async () => {
    ipcMain.on("getAllTags", async (event) => {
        try {
            const allTags = await getAllTags();
            event.sender.send("didGetAllTags", { result: true, data: allTags });
        } catch (error) {
            event.sender.send("didGetAllTags", { result: false, data: null });
        }
    });
};

const ipcMainGetTargetTerms = async () => {
    ipcMain.on("getTargetTerms", async (event, args: GetTargetTermsRequest) => {
        try {
            const data = args.data;
            const untilOrEqual = data.untilOrEqual;
            const tags = data.tags;
            const status = data.status;
            const targetTerms = await getTargetTerms({
                untilOrEqual,
                tags,
                status,
            });
            event.sender.send("didGetTargetTerms", {
                result: true,
                data: targetTerms,
            });
        } catch (error) {
            event.sender.send("didGetTargetTerms", {
                result: false,
                data: null,
            });
        }
    });
};

const ipcMainOpenDictionary = async () => {
    ipcMain.on("openDictionary", async (event, args: OpenDictionaryRequest) => {
        const data = args.data;
        const term = data.term;
        shell.openExternal(`mkdictionaries:///?text=${term}`);
    });
};

const ipcMainShowThisApp = async (mainWindow: BrowserWindow) => {
    ipcMain.on("showThisApp", () => {
        mainWindow.show();
    });
};

const ipcMainUpdateStatusAndSuspend = async () => {
    ipcMain.on(
        "updateStatusAndSuspend",
        async (event, args: UpdateStatusAndSuspendRequest) => {
            try {
                const data = args.data;
                if (data.status !== undefined && data.status !== null) {
                    await updateStatus(data.id, data.status);
                }
                if (data.suspend !== undefined && data.suspend !== null) {
                    await updateSuspend(data.id, data.suspend);
                }
                const term = await getTermById(data.id);
                event.sender.send("didUpdateStatusAndSuspend", {
                    result: true,
                    data: term,
                });
            } catch (error) {
                event.sender.send("didUpdateStatusAndSuspend", {
                    result: false,
                    data: null,
                });
            }
        }
    );
};

const ipcMainToggleAlwaysOnTop = (mainWindow: BrowserWindow) => {
    ipcMain.on("toggleAlwaysOnTop", () => {
        const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
        mainWindow.setAlwaysOnTop(!isAlwaysOnTop);
    });
};

const ipcMainDownloadDb = (mainWindow: BrowserWindow) => {
    ipcMain.on("downloadDb", () => {
        download(mainWindow, devDbPath, {
            filename: "memorizer.db",
            saveAs: true,
        });
    });
};

export const ipcMainInit = (mainWindow: BrowserWindow) => {
    ipcMainAddTerm();
    ipcMainGetTerm();
    ipcMainUpdateTerm();
    ipcMainGetAllTerms();
    ipcMainDeleteTerms();
    ipcMainGetAllTags();
    ipcMainGetTargetTerms();
    ipcMainOpenDictionary();
    ipcMainShowThisApp(mainWindow);
    ipcMainUpdateStatusAndSuspend();
    ipcMainToggleAlwaysOnTop(mainWindow);
    ipcMainDownloadDb(mainWindow);
};
