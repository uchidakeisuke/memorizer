import { ipcRenderer } from "electron";

import { Memory, Tag, Term } from "../typeorm/entities";

export const ipcRendererSend = <T>(channel: string, request: T) => {
    ipcRenderer.send(channel, request);
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
    channel: string;
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
    channel: string;
};

export type GetTermRequestData = {
    id: Term["id"];
};

export type GetTermRequest = {
    data: GetTermRequestData;
    channel: string;
};

export type DeleteTermsRequestData = {
    ids: Term["id"][];
};

export type DeleteTermsRequest = {
    data: DeleteTermsRequestData;
    channel: string;
};

export type GetTargetTermsRequestData = {
    tags?: Tag["tag"][] | null;
    untilOrEqual?: Date | null;
    status?: Memory["status"][] | null;
};

export type GetTargetTermsRequest = {
    data: GetTargetTermsRequestData;
    channel: string;
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
    channel: string;
};

export type ToggleAlwaysOnTopRequestData = {
    value: boolean;
};

export type ToggleAlwaysOnTopRequest = {
    data: ToggleAlwaysOnTopRequestData;
    channel: string;
};

export type GetAllTermsRequest = {
    channel: string;
};

export type GetAllTagsRequest = {
    channel: string;
};
