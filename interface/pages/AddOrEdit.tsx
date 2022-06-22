import { IpcRendererEvent, ipcRenderer } from "electron";
import $ from "jquery";
import { Button } from "primereact/button";
import { Calendar, CalendarChangeParams } from "primereact/calendar";
import { Card } from "primereact/card";
import { Chips, ChipsChangeParams } from "primereact/chips";
import { Editor, EditorTextChangeParams } from "primereact/editor";
import { InputText, InputTextProps } from "primereact/inputtext";
import React, {
    KeyboardEventHandler,
    useEffect,
    useRef,
    useState,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
    AddTermRequest,
    GetTermRequest,
    UpdateStatusAndSuspendRequest,
    UpdateTermRequest,
    ipcRendererSend,
} from "../../app/ipc/request";
import {
    AddTermResponse,
    GetTermResponse,
    UpdateStatusAndSuspendResponse,
    UpdateTermResponse,
} from "../../app/ipc/response";
import { Memory, Tag, Term } from "../../app/typeorm/entities";
import { ShowMessage } from "../App";
import { EditorHeader, Footer } from "../components";
import { errorSummary, successSummary } from "../messages";
import "../styles/calendar.scss";
import "../styles/editor.scss";
import "../styles/input.css";
import "../styles/toast.css";
import { InputTextOnChangeEvent } from "../types";

type AddOrEditProps = {
    showMessage: ShowMessage;
};

export const AddOrEdit = (props: AddOrEditProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const submitButton = useRef(null);
    const termInput = useRef(null);

    const [isTextError, setIsTextError] = useState(false);

    const [id, setId] = useState<Term["id"] | null>(null);
    const [text, setText] = useState("");
    const [note, setNote] = useState("");
    const [videoUrls, setVideoUrls] = useState<Term["videos"][number]["url"][]>(
        [""]
    );
    const [videoStarts, setVideoStarts] = useState<
        Term["videos"][number]["start"][]
    >(["00:00:00"]);
    const [videoEnds, setVideoEnds] = useState<Term["videos"][number]["end"][]>(
        ["00:00:00"]
    );
    const [tags, setTags] = useState<Tag["tag"][]>([]);
    const [status, setStatus] = useState<Memory["status"] | null>(null);
    const [suspend, setSuspend] = useState<Memory["suspend"] | null>(null);

    const didAddTerm = (event: IpcRendererEvent, args: AddTermResponse) => {
        const term = args.data;
        if (term) {
            refresh(null);
            props.showMessage(
                "success",
                successSummary,
                <p>
                    <Link
                        to={{ pathname: "/view" }}
                        state={{ id: term.id }}
                        className="text-blue-500"
                    >
                        {term.term}
                    </Link>{" "}
                    was added
                </p>
            );
        } else {
            props.showMessage("error", errorSummary, "Failed to add a term...");
        }
    };

    const didUpdateTerm = (
        event: IpcRendererEvent,
        args: UpdateTermResponse
    ) => {
        if (args.data) {
            const term = args.data;
            navigate("/view", {
                state: { id: term.id, updateSucceeded: true },
            });
        } else {
            props.showMessage(
                "error",
                errorSummary,
                "Failed to update a term..."
            );
        }
    };

    const didGetTerm = (event: IpcRendererEvent, args: GetTermResponse) => {
        if (args.data) {
            const term = args.data;
            refresh(term);
        } else {
            props.showMessage("error", errorSummary, "Failed to get a term...");
        }
    };

    const didUpdateStatusAndSuspend = (
        event: IpcRendererEvent,
        args: UpdateStatusAndSuspendResponse
    ) => {
        if (args.data) {
            const term = args.data;
            navigate("/view", {
                state: { id: term.id, updateSucceeded: true },
            });
        } else {
            props.showMessage(
                "error",
                errorSummary,
                "Failed to update a term..."
            );
        }
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.code === "Enter" && e.metaKey) {
            // @ts-ignore
            submitButton.current?.click();
        }
    };

    useEffect(() => {
        ipcRenderer.on("addOrEditDidAddTerm", didAddTerm);
        ipcRenderer.on("addOrEditDidUpdateTerm", didUpdateTerm);
        ipcRenderer.on("addOrEditDidGetTerm", didGetTerm);
        ipcRenderer.on(
            "addOrEditDidUpdateStatusAndSuspend",
            didUpdateStatusAndSuspend
        );
        document.addEventListener("keydown", onKeyDown);
        return () => {
            ipcRenderer.off("addOrEditDidAddTerm", didAddTerm);
            ipcRenderer.off("addOrEditDidUpdateTerm", didUpdateTerm);
            ipcRenderer.off("addOrEditDidGetTerm", didGetTerm);
            ipcRenderer.off(
                "addOrEditDidUpdateStatusAndSuspend",
                didUpdateStatusAndSuspend
            );
            document.removeEventListener("keydown", onKeyDown);
        };
    }, []);

    useEffect(() => {
        if ((location.state as { focus: boolean })?.focus) {
            (termInput?.current as { focus: () => void } | null)?.focus();
        }
        const termId = (location.state as { id: number })?.id;
        if (termId) {
            ipcRendererSend<GetTermRequest>("getTerm", {
                data: {
                    id: termId,
                },
                channel: "addOrEditDidGetTerm",
            });
        } else {
            refresh(null);
        }
    }, [location.state]);

    const createVideoArray = () => {
        const videos = videoUrls.map((videoUrl, index) => {
            return {
                url: videoUrl,
                start: videoStarts[index],
                end: videoEnds[index],
            };
        });
        return videos;
    };

    const update = () => {
        if (!id) {
            props.showMessage("error", errorSummary, "No id to update...");
            return;
        }

        const videos = createVideoArray();
        ipcRendererSend<UpdateTermRequest>("updateTerm", {
            data: {
                id: id,
                term: text,
                note: note,
                videos: videos,
                tags: tags,
            },
            channel: "addOrEditDidUpdateTerm",
        });
        const statusToUpdate = status || undefined;
        const suspendToUpdate = suspend || undefined;
        ipcRendererSend<UpdateStatusAndSuspendRequest>(
            "updateStatusAndSuspend",
            {
                data: {
                    id: id,
                    status: statusToUpdate,
                    suspend: suspendToUpdate,
                },
                channel: "addOrEditDidUpdateStatusAndSuspend",
            }
        );
    };

    const add = () => {
        const videos = createVideoArray();
        ipcRendererSend<AddTermRequest>("addTerm", {
            data: {
                term: text,
                note: note,
                videos: videos,
                tags: tags,
            },
            channel: "addOrEditDidAddTerm",
        });
    };

    const refresh = (term: Term | null) => {
        if (term) {
            setId(term.id);
            setText(term.term);
            setIsTextError(false);
            setNote(term.note);

            const tmpVideoUrls = [];
            const tmpVideoStarts = [];
            const tmpVideoEnds = [];
            for (const video of term.videos) {
                tmpVideoUrls.push(video.url);
                tmpVideoStarts.push(video.start);
                tmpVideoEnds.push(video.end);
            }
            setVideoUrls(tmpVideoUrls.length ? tmpVideoUrls : [""]);
            setVideoStarts(
                tmpVideoStarts.length ? tmpVideoStarts : ["00:00:00"]
            );
            setVideoEnds(tmpVideoEnds.length ? tmpVideoEnds : ["00:00:00"]);

            const tmpTags = term.tags?.map((tag) => tag.tag) || [];
            setTags(tmpTags);
            setStatus(null);
            setSuspend(null);
        } else {
            setId(null);
            setText("");
            setIsTextError(false);
            setVideoUrls([""]);
            setVideoStarts(["00:00:00"]);
            setVideoEnds(["00:00:00"]);
            setTags([]);
            setStatus(null);
            setSuspend(null);
            setNote("");
            $('.ql-editor[contenteditable="true"]').children().remove();
        }
    };

    const onChangeTermText: InputTextProps["onChange"] = (e) => {
        const value = e.target.value;
        setText(value);
    };

    const onLoadEditor = () => {
        $(".p-editor-toolbar span").attr("tabindex", "-1");
    };

    const onChangeEditor = (e: EditorTextChangeParams) => {
        const html = e.htmlValue || "";
        setNote(html);
    };

    const onEditorKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
        if (e.code === "Tab") {
            $("#video-url0").get(0)?.focus();
            e.preventDefault();
        }
    };

    const onChangeVideoUrl = (i: number, e: InputTextOnChangeEvent) => {
        const value = e.target.value;
        const tmpVideoUrls = [...videoUrls];
        tmpVideoUrls[i] = value;
        setVideoUrls(tmpVideoUrls);
    };

    const onChangeVideoStart = (i: number, e: InputTextOnChangeEvent) => {
        const value = e.target.value;
        const tmpVideoStarts = [...videoStarts];
        tmpVideoStarts[i] = value;
        setVideoStarts(tmpVideoStarts);
    };

    const onChangeVideoEnd = (i: number, e: InputTextOnChangeEvent) => {
        const value = e.target.value;
        const tmpVideoEnds = [...videoEnds];
        tmpVideoEnds[i] = value;
        setVideoEnds(tmpVideoEnds);
    };

    const onClickAddVideoInput = () => {
        setVideoUrls([...videoUrls, ""]);
        setVideoStarts([...videoStarts, "00:00:00"]);
        setVideoEnds([...videoEnds, "00:00:00"]);
    };

    const onClickDeleteInput = (i: number) => {
        const tmpVideoUrls = [...videoUrls];
        tmpVideoUrls.splice(i, 1);
        setVideoUrls(tmpVideoUrls);

        const tmpVideoStarts = [...videoStarts];
        tmpVideoStarts.splice(i, 1);
        setVideoStarts(tmpVideoStarts);

        const tmpVideoEnds = [...videoEnds];
        tmpVideoEnds.splice(i, 1);
        setVideoEnds(tmpVideoEnds);
    };

    const onClickGoForward = (i: number) => {
        if (i === 0) return;

        const tmpVideoUrls = [...videoUrls];
        const videoUrl = tmpVideoUrls.slice(i, i + 1)[0];
        tmpVideoUrls.splice(i, 1);
        tmpVideoUrls.splice(i - 1, 0, videoUrl);
        setVideoUrls(tmpVideoUrls);

        const tmpVideoStarts = [...videoStarts];
        const videoStart = tmpVideoStarts.slice(i, i + 1)[0];
        tmpVideoStarts.splice(i, 1);
        tmpVideoStarts.splice(i - 1, 0, videoStart);
        setVideoStarts(tmpVideoStarts);

        const tmpVideoEnds = [...videoEnds];
        const videoEnd = tmpVideoEnds.slice(i, i + 1)[0];
        tmpVideoEnds.splice(i, 1);
        tmpVideoEnds.splice(i - 1, 0, videoEnd);
        setVideoEnds(tmpVideoEnds);
    };

    const onClickGoBackward = (i: number) => {
        if (i === videoUrls.length - 1) return;

        const tmpVideoUrls = [...videoUrls];
        const videoUrl = tmpVideoUrls.slice(i, i + 1)[0];
        tmpVideoUrls.splice(i, 1);
        tmpVideoUrls.splice(i + 1, 0, videoUrl);
        setVideoUrls(tmpVideoUrls);

        const tmpVideoStarts = [...videoStarts];
        const videoStart = tmpVideoStarts.slice(i, i + 1)[0];
        tmpVideoStarts.splice(i, 1);
        tmpVideoStarts.splice(i + 1, 0, videoStart);
        setVideoStarts(tmpVideoStarts);

        const tmpVideoEnds = [...videoEnds];
        const videoEnd = tmpVideoEnds.slice(i, i + 1)[0];
        tmpVideoEnds.splice(i, 1);
        tmpVideoEnds.splice(i + 1, 0, videoEnd);
        setVideoEnds(tmpVideoEnds);
    };

    const onChangeTags = (e: ChipsChangeParams) => {
        const value = e.value;
        setTags(value);
    };

    const onChangeStatus = (e: InputTextOnChangeEvent) => {
        const value = e.target.value;
        const statusToSet = parseInt(value);
        setStatus(statusToSet);
    };

    const onChangeSuspend = (e: CalendarChangeParams) => {
        const value = e.value;
        if (!value) {
            const suspendToSet = null;
            setSuspend(suspendToSet);
        } else if (Array.isArray(value) && value.length) {
            const suspendToSet = value[0];
            setSuspend(suspendToSet);
        } else {
            // @ts-ignore
            setSuspend(value);
        }
    };

    const onClickSubmit = () => {
        if (!text) {
            setIsTextError(true);
            props.showMessage("error", errorSummary, "No term...");
            return;
        }

        setIsTextError(false);

        if (id) {
            update();
        } else {
            add();
        }
    };

    return (
        <div className="mb-20">
            <Card>
                <div className="field mb-4">
                    <label className="block mb-2 font-semibold">Term</label>
                    <InputText
                        value={text}
                        onChange={onChangeTermText}
                        className={`block w-full${
                            isTextError ? " p-invalid" : ""
                        }`}
                        autoFocus={true}
                        ref={termInput}
                    />
                </div>
                <div className="field mb-4">
                    <label className="block mb-2 font-semibold">Note</label>
                    <Editor
                        headerTemplate={EditorHeader}
                        onTextChange={onChangeEditor}
                        value={note}
                        onLoad={onLoadEditor}
                        onKeyDownCapture={onEditorKeyDown}
                    />
                </div>
                <div className="field mb-4">
                    <div className="mb-2 flex items-center">
                        <label className="mr-2 font-semibold">
                            YouTube Videos
                        </label>
                        <Button
                            className="cursor-pointer p-button-text"
                            icon="pi pi-plus-circle"
                            onClick={onClickAddVideoInput}
                        />
                    </div>
                    {videoUrls.map((videoUrl, i) => (
                        <div key={i} className="flex flex-row w-full">
                            <div className="flex flex-col mr-4">
                                <Button
                                    className="mb-4 p-button-text"
                                    icon="pi pi-angle-up"
                                    onClick={() => onClickGoForward(i)}
                                />
                                <Button
                                    className="p-button-text"
                                    icon="pi pi-angle-down"
                                    onClick={() => onClickGoBackward(i)}
                                />
                            </div>
                            <div className="mb-7 w-full">
                                <div className="p-inputgroup mb-4">
                                    <span className="p-inputgroup-addon">
                                        <i className="pi pi-youtube"></i>
                                    </span>
                                    <InputText
                                        value={videoUrl}
                                        onChange={(e) => onChangeVideoUrl(i, e)}
                                        className="block w-full"
                                        placeholder="YouTube Video URL"
                                        id={`video-url${i}`}
                                    />
                                </div>
                                <div className="flex">
                                    <div className="grow">
                                        <InputText
                                            value={videoStarts[i]}
                                            onChange={(e) =>
                                                onChangeVideoStart(i, e)
                                            }
                                            className="w-2/5 mr-4"
                                            placeholder="Start"
                                            type="time"
                                            step={1}
                                        />
                                        <InputText
                                            value={videoEnds[i]}
                                            onChange={(e) =>
                                                onChangeVideoEnd(i, e)
                                            }
                                            className="w-2/5"
                                            placeholder="End"
                                            type="time"
                                            step={1}
                                        />
                                    </div>
                                    <div className="flex flex-end">
                                        <Button
                                            className="p-button-text"
                                            icon="pi pi-minus-circle"
                                            onClick={() => {
                                                onClickDeleteInput(i);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mb-4">
                    <label className="block mb-2 font-semibold">Tags</label>
                    <Chips
                        value={tags}
                        onChange={onChangeTags}
                        separator=","
                        className="w-full"
                    />
                </div>
                {id && (
                    <React.Fragment>
                        <div className="mb-4">
                            <label className="block mb-2 font-semibold">
                                Status
                            </label>
                            <InputText
                                value={status || undefined}
                                onChange={onChangeStatus}
                                className="block w-full"
                                type="number"
                                min={1}
                                max={6}
                                step={1}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2 font-semibold">
                                Suspend
                            </label>
                            <Calendar
                                value={suspend || undefined}
                                onChange={onChangeSuspend}
                                showTime
                                showSeconds
                                className="block w-full"
                            />
                        </div>
                    </React.Fragment>
                )}
            </Card>
            <Footer>
                <Button
                    label="Submit"
                    onClick={onClickSubmit}
                    ref={submitButton}
                />
            </Footer>
        </div>
    );
};
