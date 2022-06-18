import { zonedTimeToUtc } from "date-fns-tz";
import { IpcRendererEvent, ipcRenderer } from "electron";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";
import { MultiSelect } from "primereact/multiselect";
import { ScrollPanel } from "primereact/scrollpanel";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
    GetTargetTermsRequestData,
    OpenDictionaryRequestData,
    UpdateStatusAndSuspendRequestData,
    ipcRendererSend,
} from "../../app/ipc/request";
import {
    GetAllTagsResponse,
    GetTargetTermsResponse,
    UpdateStatusAndSuspendResponse,
} from "../../app/ipc/response";
import { Memory, Tag, Term } from "../../app/typeorm/entities";
import { getValue, setValue } from "../../shared/local_store";
import { ShowMessage } from "../App";
import { Footer, YoutubeGallery } from "../components";
import { DictionaryIconLink } from "../components";
// @ts-ignore
import dictionariesImg from "../dictionary_icons/dictionaries.png";
// @ts-ignore
import macmillanImg from "../dictionary_icons/macmillan.png";
// @ts-ignore
import urbandictionaryImg from "../dictionary_icons/urbandictionary.png";
import { convertStringTimeToSeconds, shuffleArray } from "../helpers/common";
import { errorSummary, successSummary } from "../messages";
import "../styles/galleria.css";
import "../styles/play.scss";

const synth = window.speechSynthesis;

let intervalId: ReturnType<typeof setInterval>;
let innerIntervalCount = 0;
let skip = false;
let pause = false;
let termIndex = 0;
let waitingSecQueue: number[] = [];
let nextSeconds = 0;
let videoWaitingSecondsIndex = 0;

type PlayProps = {
    showMessage: ShowMessage;
};

export const Play = (props: PlayProps) => {
    const initialWaitVideosEnd = getValue("waitVideosEnd", true);
    const initialUseMemorizingTime = getValue("useMemorizingTime", true);
    const initialSelectedTags = getValue("selectedTags", []);
    const initialSelectedStatus = getValue("selectedStatus", []);
    const initialIntervalSec = getValue("intervalSec", 2);

    const [isPlaying, setIsPlaying] = useState(false);

    const [tags, setTags] = useState<Tag["tag"][]>([]);

    const [waitVideosEnd, setWaitVideosEnd] = useState(initialWaitVideosEnd);
    const [useMemorizingTime, setUseMemorizingTime] = useState(
        initialUseMemorizingTime
    );
    const [selectedTags, setSelectedTags] =
        useState<Tag["tag"][]>(initialSelectedTags);
    const [selectedStatus, setSelectedStatus] = useState<Memory["status"][]>(
        initialSelectedStatus
    );
    const [intervalSec, setIntervalSec] = useState<number>(initialIntervalSec);

    const [targetTerms, setTargetTerms] = useState<Term[]>([]);
    const [term, setTerm] = useState<Term | null>(null);

    const [pauseState, setPauseState] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const [increaseActiveIndex, setIncreaseActiveIndex] = useState(false);

    const didGetTargetTerms = (
        event: IpcRendererEvent,
        args: GetTargetTermsResponse
    ) => {
        const data = args.data;
        if (data) {
            const targetTerms = data || [];
            setTargetTerms(targetTerms);
        } else {
            props.showMessage("error", errorSummary, "Failed to get terms");
        }
    };

    const didGetAllTags = (
        event: IpcRendererEvent,
        args: GetAllTagsResponse
    ) => {
        const data = args.data;
        if (data) {
            const tags = data
                ? Array.from(new Set(data.map((tag) => tag.tag)))
                : [];
            setTags(tags);
        } else {
            props.showMessage("error", errorSummary, "Failed to get tags");
        }
    };

    const didUpdateStatusAndSuspend = (
        event: IpcRendererEvent,
        args: UpdateStatusAndSuspendResponse
    ) => {
        const data = args.data;
        if (data) {
            props.showMessage(
                "success",
                successSummary,
                "Succeeded to update a status",
                1000
            );
        } else {
            props.showMessage(
                "error",
                errorSummary,
                "Failed to update a status",
                1000
            );
        }
    };

    const pauseResumeButton = useRef(null);
    const togglePause = (e: KeyboardEvent) => {
        if (e.code === "Space") {
            // @ts-ignore
            pauseResumeButton.current?.click();
        }
    };

    useEffect(() => {
        ipcRenderer.send("getAllTags");
        ipcRenderer.on("didGetAllTags", didGetAllTags);
        ipcRenderer.on("didGetTargetTerms", didGetTargetTerms);
        ipcRenderer.on("didUpdateStatusAndSuspend", didUpdateStatusAndSuspend);
        document.addEventListener("keydown", togglePause);
        return () => {
            resetPlayer();
            setIsPlaying(false);
            ipcRenderer.off("didGetAllTags", didGetAllTags);
            ipcRenderer.off("didGetTargetTerms", didGetTargetTerms);
            ipcRenderer.off(
                "didUpdateStatusAndSuspend",
                didUpdateStatusAndSuspend
            );
            document.removeEventListener("keydown", togglePause);
        };
    }, []);

    useEffect(() => {
        if (isPlaying) {
            const untilOrEqual = useMemorizingTime
                ? zonedTimeToUtc(new Date(), "Asia/Tokyo")
                : null;
            ipcRendererSend<GetTargetTermsRequestData>("getTargetTerms", {
                untilOrEqual: untilOrEqual,
                tags: selectedTags,
                status: selectedStatus,
            });
        }
    }, [isPlaying]);

    useEffect(() => {
        if (isPlaying) {
            start();
        }
    }, [targetTerms]);

    useEffect(() => {
        if (increaseActiveIndex) {
            setActiveIndex(activeIndex + 1);
        }
    }, [increaseActiveIndex]);

    const resetPlayer = () => {
        clearInterval(intervalId);
        setTerm(null);
        innerIntervalCount = 0;
        skip = false;
        pause = false;
        termIndex = 0;
        waitingSecQueue = [];
        videoWaitingSecondsIndex = 0;
        nextSeconds = 0;
        setPauseState(false);
        setIsPlaying(false);
    };

    const play = (terms: Term[]) => {
        const nextTerm = terms.length ? terms[termIndex] : null;
        setTerm(nextTerm);

        nextSeconds = intervalSec;
        if (waitVideosEnd && nextTerm?.videos && nextTerm.videos.length) {
            nextSeconds = 0;
            let prevVideoSeconds = 0;
            for (const video of nextTerm.videos) {
                const start = convertStringTimeToSeconds(video.start);
                const end = convertStringTimeToSeconds(video.end);
                const videoSeconds = end - start;
                const accVideoSeconds = prevVideoSeconds + videoSeconds;
                nextSeconds += videoSeconds;
                waitingSecQueue.push(accVideoSeconds);
                prevVideoSeconds = accVideoSeconds;
            }
        }

        if (nextTerm?.term) {
            ipcRendererSend<OpenDictionaryRequestData>("openDictionary", {
                term: nextTerm.term,
            });
            const message = new SpeechSynthesisUtterance(nextTerm.term);
            message.lang = "en-US";
            synth.speak(message);
            ipcRenderer.send("showThisApp");
        }
        termIndex += 1;
    };

    const start = () => {
        const terms = shuffleArray(targetTerms);
        intervalId = setInterval(() => {
            if (!pause) {
                if (!skip) {
                    if (terms.length <= termIndex) {
                        resetPlayer();
                        return;
                    }
                    play(terms);
                }
                if (
                    waitingSecQueue[videoWaitingSecondsIndex] + 1 ===
                    innerIntervalCount
                ) {
                    setIncreaseActiveIndex(true);
                    videoWaitingSecondsIndex += 1;
                } else {
                    setIncreaseActiveIndex(false);
                }
                innerIntervalCount += 1;
                if (nextSeconds === innerIntervalCount) {
                    skip = false;
                    innerIntervalCount = 0;
                } else {
                    skip = true;
                }
            }
        }, 1000);
    };

    const memorized = () => {
        const termId = term?.id || undefined;
        if (!termId) {
            props.showMessage("error", errorSummary, "No term to update...");
            return;
        }
        if (term?.memory.status && term.memory.status !== 6) {
            const statusToUpdate = term.memory.status + 1;
            ipcRendererSend<UpdateStatusAndSuspendRequestData>(
                "updateStatusAndSuspend",
                {
                    id: termId,
                    status: statusToUpdate,
                }
            );
        }
    };

    const forgot = () => {
        const termId = term?.id || undefined;
        if (!termId) {
            props.showMessage("error", errorSummary, "No term to update...");
            return;
        }
        if (term?.memory.status && term?.memory.status !== 1) {
            const statusToUpdate = term.memory.status - 1;
            ipcRendererSend<UpdateStatusAndSuspendRequestData>(
                "updateStatusAndSuspend",
                {
                    id: termId,
                    status: statusToUpdate,
                }
            );
        }
    };

    return (
        <div>
            {isPlaying ? (
                <div>
                    <div className="mb-4 flex justify-center">
                        <Button
                            icon={`pi ${pauseState ? "pi-play" : "pi-pause"}`}
                            className="p-button-rounded mr-2"
                            onClick={() => {
                                if (pause) {
                                    pause = false;
                                } else {
                                    pause = true;
                                }

                                if (pauseState) {
                                    setPauseState(false);
                                } else {
                                    setPauseState(true);
                                }
                            }}
                            ref={pauseResumeButton}
                        />
                        <Button
                            icon="pi pi-stop"
                            className="p-button-rounded"
                            onClick={() => resetPlayer()}
                        />
                    </div>
                    <Card>
                        <div className="w-full mb-4 flex justify-center">
                            <div className="mr-2">
                                <DictionaryIconLink
                                    linkUrl={`mkdictionaries:///?text=${term?.term}`}
                                    imgPath={dictionariesImg}
                                />
                            </div>
                            <div className="mr-2">
                                <DictionaryIconLink
                                    linkUrl={`https://www.urbandictionary.com/define.php?term=${term?.term}`}
                                    imgPath={urbandictionaryImg}
                                    openNewWindow={true}
                                />
                            </div>
                            <div>
                                <DictionaryIconLink
                                    linkUrl={`https://www.macmillandictionary.com/us/dictionary/american/${term?.term}`}
                                    imgPath={macmillanImg}
                                    openNewWindow={true}
                                />
                            </div>
                        </div>
                        <div className="w-full mb-4 flex justify-center">
                            <Button
                                label="Forgot..."
                                className="p-button-outlined p-button-sm mr-2"
                                onClick={forgot}
                            />
                            <Button
                                label="Memorized!"
                                className="p-button-sm"
                                onClick={memorized}
                            />
                        </div>
                        <div className="w-full mb-4 flex justify-center">
                            <p className="text-2xl font-semibold">
                                <Link
                                    to={{ pathname: "/view" }}
                                    state={{ id: term?.id }}
                                >
                                    {term?.term}
                                </Link>
                            </p>
                        </div>
                        <div className="w-full mb-4 flex justify-center max-h-64">
                            <ScrollPanel className="w-full max-h-64">
                                <div
                                    className="ql-editor"
                                    dangerouslySetInnerHTML={{
                                        __html: term?.note || "",
                                    }}
                                />
                            </ScrollPanel>
                        </div>
                        <div>
                            {term?.videos.length ? (
                                <YoutubeGallery
                                    videos={term.videos}
                                    activeIndex={activeIndex}
                                    onItemChange={(value) =>
                                        setActiveIndex(value)
                                    }
                                    autoplay={waitVideosEnd ? true : false}
                                />
                            ) : (
                                <div></div>
                            )}
                        </div>
                    </Card>
                </div>
            ) : (
                <React.Fragment>
                    <Card>
                        <div className="w-full mb-4 flex justify-center">
                            <Button
                                icon="pi pi-play"
                                className="p-button-rounded play-button"
                                onClick={() => setIsPlaying(true)}
                            />
                        </div>
                        <div className="w-full mb-4">
                            <label className="block mb-2 font-semibold">
                                Wait for videos to end
                            </label>
                            <InputSwitch
                                checked={waitVideosEnd}
                                onChange={(e) => {
                                    setWaitVideosEnd(e.value);
                                    setValue("waitVideosEnd", e.value);
                                }}
                            />
                        </div>
                        <div className="w-full mb-4">
                            <label className="block mb-2 font-semibold">
                                Use Memorizing Time
                            </label>
                            <InputSwitch
                                checked={useMemorizingTime}
                                onChange={(e) => {
                                    setUseMemorizingTime(e.value);
                                    setValue("useMemorizingTime", e.value);
                                }}
                            />
                        </div>
                        <div className="w-full mb-4">
                            <label className="block mb-2 font-semibold">
                                Tags
                            </label>
                            <MultiSelect
                                value={selectedTags}
                                options={tags}
                                onChange={(e) => {
                                    setSelectedTags(e.value);
                                    setValue("selectedTags", e.value);
                                }}
                                placeholder="Select Tags"
                                filter
                                className="multiselect-custom w-full"
                            />
                        </div>
                        <div className="w-full mb-4">
                            <label className="block mb-2 font-semibold">
                                Status
                            </label>
                            <MultiSelect
                                value={selectedStatus}
                                options={[1, 2, 3, 4, 5, 6]}
                                onChange={(e) => {
                                    setSelectedStatus(e.value);
                                    setValue("selectedStatus", e.value);
                                }}
                                placeholder="Select Status"
                                filter
                                className="multiselect-custom w-full"
                            />
                        </div>
                        <div className="w-full mb-4">
                            <label className="block mb-2 font-semibold">
                                Interval Seconds
                            </label>
                            <InputNumber
                                value={intervalSec}
                                onValueChange={(e) => {
                                    const sec = e.value || intervalSec;
                                    setIntervalSec(sec);
                                    setValue("intervalSec", sec);
                                }}
                                suffix=" sec"
                                className="w-full"
                                min={1}
                                step={1}
                            />
                        </div>
                    </Card>
                </React.Fragment>
            )}
            <Footer></Footer>
        </div>
    );
};
