import { ipcRenderer } from "electron";

import { Memory, Tag, Term } from "../typeorm/entities";

export const ipcRendererSend = <T>(channel: string, data: T) => {
    const requestBody = {
        data: data,
    };
    ipcRenderer.send(channel, requestBody);
};

export type AddTermRequestData = {
    term: Term["term"];
    note: Term["note"];
    videos: {
        url: Term["videos"][number]["url"];
        start: Term["videos"][number]["start"];
        end: Term["videos"][number]["end"];
    }[];
    tags: Tag["tag"][];
};

export type AddTermRequest = {
    data: AddTermRequestData;
};

export type UpdateTermRequestData = {
    id: Term["id"];
    term?: Term["term"];
    note?: Term["note"];
    videos?: {
        url: Term["videos"][number]["url"];
        start: Term["videos"][number]["start"];
        end: Term["videos"][number]["end"];
    }[];
    tags?: Tag["tag"][];
};

export type UpdateTermRequest = {
    data: UpdateTermRequestData;
};

export type GetTermRequestData = {
    id: Term["id"];
};

export type GetTermRequest = {
    data: GetTermRequestData;
};

export type DeleteTermsRequestData = {
    ids: Term["id"][];
};

export type DeleteTermsRequest = {
    data: DeleteTermsRequestData;
};

export type GetTargetTermsRequestData = {
    tags?: Tag["tag"][] | null;
    untilOrEqual?: Date | null;
    status?: Memory["status"][] | null;
};

export type GetTargetTermsRequest = {
    data: GetTargetTermsRequestData;
};

export type OpenDictionaryRequestData = {
    term: string;
};

export type OpenDictionaryRequest = {
    data: OpenDictionaryRequestData;
};

export type UpdateStatusAndSuspendRequestData = {
    id: Term["id"];
    status?: Memory["status"];
    suspend?: Memory["suspend"];
};

export type UpdateStatusAndSuspendRequest = {
    data: UpdateStatusAndSuspendRequestData;
};
