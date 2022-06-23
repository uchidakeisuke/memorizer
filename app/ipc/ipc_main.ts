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
import { Term } from "../typeorm/entities";
import {
    AddTermRequest,
    DeleteTermsRequest,
    GetAllTagsRequest,
    GetAllTermsRequest,
    GetTargetTermsRequest,
    GetTermRequest,
    OpenDictionaryRequest,
    ToggleAlwaysOnTopRequest,
    UpdateStatusAndSuspendRequest,
    UpdateTermRequest,
} from "./request";
import {
    AddTermResponse,
    DeleteTermsResponse,
    GetAllTagsResponse,
    GetAllTermsResponse,
    GetTargetTermsResponse,
    GetTermResponse,
    ToggleAlwaysOnTopResponse,
    UpdateStatusAndSuspendResponse,
    UpdateTermResponse,
} from "./response";

const ipcMainSend = <T>(
    event: Electron.IpcMainEvent,
    channel: string,
    data: T
) => {
    event.sender.send(channel, data);
};

const ipcMainAddTerm = async () => {
    ipcMain.on("addTerm", async (event, args: AddTermRequest) => {
        const channel = args.channel;
        try {
            const data = args.data;
            const createdTerm = await createTerm({
                term: data.term,
                note: data.note,
                lookUp: data.lookUp,
                pronounce: data.pronounce,
                videos: data.videos,
                tags: data.tags,
            });
            const termId = createdTerm.term.identifiers.length
                ? createdTerm.term.identifiers[0].id
                : null;

            let term: Term | null = null;
            if (termId && typeof termId === "number") {
                term = await getTermById(termId);
                ipcMainSend<AddTermResponse>(event, channel, {
                    result: Boolean(term),
                    data: term,
                });
            } else {
                ipcMainSend<AddTermResponse>(event, channel, {
                    result: false,
                    data: null,
                });
            }
        } catch (error) {
            ipcMainSend<AddTermResponse>(event, channel, {
                result: false,
                data: null,
            });
        }
    });
};

const ipcMainGetTerm = async () => {
    ipcMain.on("getTerm", async (event, args: GetTermRequest) => {
        const channel = args.channel;
        try {
            const data = args.data;
            const termId = data.id;

            let term: Term | null = null;
            if (termId && typeof termId === "number") {
                term = await getTermById(termId);
            } else {
                ipcMainSend<GetTermResponse>(event, channel, {
                    result: true,
                    data: null,
                });
            }
            ipcMainSend<GetTermResponse>(event, channel, {
                result: Boolean(term),
                data: term,
            });
        } catch (error) {
            ipcMainSend<GetTermResponse>(event, channel, {
                result: false,
                data: null,
            });
        }
    });
};

const ipcMainUpdateTerm = async () => {
    ipcMain.on("updateTerm", async (event, args: UpdateTermRequest) => {
        const channel = args.channel;
        try {
            const data = args.data;
            await updateTerm({
                id: data.id,
                term: data.term,
                note: data.note,
                lookUp: data.lookUp,
                pronounce: data.pronounce,
                videos: data.videos,
                tags: data.tags,
            });
            const term = await getTermById(data.id);
            ipcMainSend<UpdateTermResponse>(event, channel, {
                result: Boolean(term),
                data: term,
            });
        } catch (error) {
            ipcMainSend<UpdateTermResponse>(event, channel, {
                result: false,
                data: null,
            });
        }
    });
};

const ipcMainGetAllTerms = async () => {
    ipcMain.on("getAllTerms", async (event, args: GetAllTermsRequest) => {
        const channel = args.channel;
        try {
            const allTerms = await getAllTerms();
            ipcMainSend<GetAllTermsResponse>(event, channel, {
                result: true,
                data: allTerms,
            });
        } catch (error) {
            ipcMainSend<GetAllTermsResponse>(event, channel, {
                result: false,
                data: null,
            });
        }
    });
};

const ipcMainDeleteTerms = async () => {
    ipcMain.on("deleteTerms", async (event, args: DeleteTermsRequest) => {
        const channel = args.channel;
        try {
            const data = args.data;
            const ids = data.ids;
            await deleteTerms(ids);
            const terms = await getTermByIds(ids);
            if (!terms || !terms.length) {
                ipcMainSend<DeleteTermsResponse>(event, channel, {
                    result: true,
                });
            } else {
                ipcMainSend<DeleteTermsResponse>(event, channel, {
                    result: false,
                });
            }
        } catch (error) {
            ipcMainSend<DeleteTermsResponse>(event, channel, {
                result: false,
            });
        }
    });
};

const ipcMainGetAllTags = async () => {
    ipcMain.on("getAllTags", async (event, args: GetAllTagsRequest) => {
        const channel = args.channel;
        try {
            const allTags = await getAllTags();
            ipcMainSend<GetAllTagsResponse>(event, channel, {
                result: true,
                data: allTags,
            });
        } catch (error) {
            ipcMainSend<GetAllTagsResponse>(event, channel, {
                result: false,
                data: null,
            });
        }
    });
};

const ipcMainGetTargetTerms = async () => {
    ipcMain.on("getTargetTerms", async (event, args: GetTargetTermsRequest) => {
        const channel = args.channel;
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
            ipcMainSend<GetTargetTermsResponse>(event, channel, {
                result: true,
                data: targetTerms,
            });
        } catch (error) {
            ipcMainSend<GetTargetTermsResponse>(event, channel, {
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
            const channel = args.channel;
            try {
                const data = args.data;
                if (data.status !== undefined && data.status !== null) {
                    await updateStatus(data.id, data.status);
                }
                if (data.suspend !== undefined && data.suspend !== null) {
                    await updateSuspend(data.id, data.suspend);
                }
                const term = await getTermById(data.id);
                ipcMainSend<UpdateStatusAndSuspendResponse>(event, channel, {
                    result: Boolean(term),
                    data: term,
                });
            } catch (error) {
                ipcMainSend<UpdateStatusAndSuspendResponse>(event, channel, {
                    result: false,
                    data: null,
                });
            }
        }
    );
};

const ipcMainToggleAlwaysOnTop = (mainWindow: BrowserWindow) => {
    ipcMain.on("toggleAlwaysOnTop", (event, args: ToggleAlwaysOnTopRequest) => {
        const channel = args.channel;
        const value = args.data.value;
        mainWindow.setAlwaysOnTop(value);
        const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
        ipcMainSend<ToggleAlwaysOnTopResponse>(event, channel, {
            result: true,
            data: isAlwaysOnTop,
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
};
