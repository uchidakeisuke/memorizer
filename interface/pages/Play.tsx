import { zonedTimeToUtc } from "date-fns-tz";
import { IpcRendererEvent, ipcRenderer } from "electron";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";
import { MultiSelect } from "primereact/multiselect";
import { ScrollPanel } from "primereact/scrollpanel";
import { Tag } from "primereact/tag";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    GetTargetTermsRequest,
    OpenDictionaryRequest,
    UpdateStatusAndSuspendRequest,
    ipcRendererSend,
} from "../../app/ipc/request";
import {
    GetAllTagsResponse,
    GetTargetTermsResponse,
    UpdateStatusAndSuspendResponse,
} from "../../app/ipc/response";
import { Memory, Tag as TagEntity, Term } from "../../app/typeorm/entities";
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
    const initialDontPronounceWhenVideosPlay = getValue(
        "dontPronounceWhenVideosPlay",
        true
    );
    const initialWaitVideosEnd = getValue("waitVideosEnd", true);
    const initialUseMemorizingTime = getValue("useMemorizingTime", true);
    const initialSelectedTags = getValue("selectedTags", []);
    const initialSelectedStatus = getValue("selectedStatus", []);
    const initialIntervalSec = getValue("intervalSec", 2);

    const navigate = useNavigate();

    const [isPlaying, setIsPlaying] = useState(false);

    const [tags, setTags] = useState<TagEntity["tag"][]>([]);

    const [dontPronounceWhenVideosPlay, setDontPronounceWhenVideosPlay] =
        useState(initialDontPronounceWhenVideosPlay);
    const [waitVideosEnd, setWaitVideosEnd] = useState(initialWaitVideosEnd);
    const [useMemorizingTime, setUseMemorizingTime] = useState(
        initialUseMemorizingTime
    );
    const [selectedTags, setSelectedTags] =
        useState<TagEntity["tag"][]>(initialSelectedTags);
    const [selectedStatus, setSelectedStatus] = useState<Memory["status"][]>(
        initialSelectedStatus
    );
    const [intervalSec, setIntervalSec] = useState<number>(initialIntervalSec);

    const [targetTerms, setTargetTerms] = useState<Term[]>([]);
    const [term, setTerm] = useState<Term | null>(null);

    const [pauseState, setPauseState] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const [increaseActiveIndex, setIncreaseActiveIndex] = useState(false);

    const [pronouncing, setPronouncing] = useState(false);

    const copy = (term: string) => {
        navigator.clipboard.writeText(term);
    };

    const tempPronounce = (term: string) => {
        if (pronouncing) {
            speechSynthesis.cancel();
        } else {
            const message = new SpeechSynthesisUtterance(term);
            message.lang = "en-US";
            synth.speak(message);
        }
        setPronouncing(!pronouncing);
    };

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
        ipcRenderer.on("playDidGetTargetTerms", didGetTargetTerms);
        ipcRenderer.on(
            "playDidUpdateStatusAndSuspend",
            didUpdateStatusAndSuspend
        );
        document.addEventListener("keydown", togglePause);
        return () => {
            resetPlayer();
            setIsPlaying(false);
            ipcRenderer.off("didGetAllTags", didGetAllTags);
            ipcRenderer.off("playDidGetTargetTerms", didGetTargetTerms);
            ipcRenderer.off(
                "playDidUpdateStatusAndSuspend",
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
            ipcRendererSend<GetTargetTermsRequest>("getTargetTerms", {
                data: {
                    untilOrEqual: untilOrEqual,
                    tags: selectedTags,
                    status: selectedStatus,
                },
                channel: "playDidGetTargetTerms",
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
        setActiveIndex(0);
    };

    const pronounce = (term: string) => {
        const message = new SpeechSynthesisUtterance(term);
        message.lang = "en-US";
        synth.speak(message);
    };

    const play = (terms: Term[]) => {
        const nextTerm = terms.length ? terms[termIndex] : null;
        setTerm(nextTerm);

        nextSeconds = intervalSec;
        waitingSecQueue = [];
        if (waitVideosEnd && nextTerm?.videos && nextTerm.videos.length) {
            nextSeconds = 0;
            let prevVideoSeconds = 0;
            for (const video of nextTerm.videos) {
                const start = convertStringTimeToSeconds(video.start);
                const end = convertStringTimeToSeconds(video.end);
                const videoSeconds = end - start + 1;
                const accVideoSeconds = prevVideoSeconds + videoSeconds;
                nextSeconds += videoSeconds;
                waitingSecQueue.push(accVideoSeconds);
                prevVideoSeconds = accVideoSeconds;
            }
        }
        nextSeconds =
            nextSeconds > intervalSec
                ? nextSeconds + waitingSecQueue.length + 1
                : intervalSec;

        if (nextTerm?.term) {
            ipcRendererSend<OpenDictionaryRequest>("openDictionary", {
                data: {
                    term: nextTerm.lookUp ? nextTerm.lookUp : nextTerm.term,
                },
            });
            const pronounceThis =
                dontPronounceWhenVideosPlay && nextTerm.videos.length
                    ? ""
                    : nextTerm.pronounce
                    ? nextTerm.pronounce
                    : nextTerm.term;
            pronounce(pronounceThis);
            ipcRenderer.send("showThisApp");
        }
        termIndex += 1;
    };

    const start = () => {
        const terms = shuffleArray(targetTerms);
        intervalId = setInterval(() => {
            if (!pause) {
                if (!skip) {
                    innerIntervalCount = 0;
                    if (termIndex >= terms.length) {
                        resetPlayer();
                        return;
                    }
                    videoWaitingSecondsIndex = 0;
                    setActiveIndex(0);
                    play(terms);
                }

                if (
                    waitingSecQueue.length &&
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
                } else {
                    skip = true;
                }
            }
        }, 1000);
    };

    const next = () => {
        if (termIndex >= targetTerms.length) return;
        termIndex += 1;
        skip = false;
    };

    const prev = () => {
        if (!termIndex) return;
        termIndex -= 1;
        skip = false;
    };

    const memorized = () => {
        const termId = term?.id || undefined;
        if (!termId) {
            props.showMessage("error", errorSummary, "No term to update...");
            return;
        }
        if (term?.memory.status && term.memory.status !== 6) {
            const statusToUpdate = term.memory.status + 1;
            ipcRendererSend<UpdateStatusAndSuspendRequest>(
                "updateStatusAndSuspend",
                {
                    data: {
                        id: termId,
                        status: statusToUpdate,
                    },
                    channel: "playDidUpdateStatusAndSuspend",
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
            ipcRendererSend<UpdateStatusAndSuspendRequest>(
                "updateStatusAndSuspend",
                {
                    data: {
                        id: termId,
                        status: statusToUpdate,
                    },
                    channel: "playDidUpdateStatusAndSuspend",
                }
            );
        }
    };

    const onClickPause = () => {
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
    };

    return (
        <div>
            {isPlaying ? (
                <div>
                    <div className="mb-4 flex justify-between">
                        <Button
                            icon="pi pi-angle-left"
                            className="p-button-rounded"
                            onClick={prev}
                        />
                        <div>
                            <Button
                                icon={`pi ${
                                    pauseState ? "pi-play" : "pi-pause"
                                }`}
                                className="p-button-rounded mr-2"
                                onClick={onClickPause}
                                ref={pauseResumeButton}
                            />
                            <Button
                                icon="pi pi-stop"
                                className="p-button-rounded"
                                onClick={resetPlayer}
                            />
                        </div>
                        <Button
                            icon="pi pi-angle-right"
                            className="p-button-rounded"
                            onClick={next}
                        />
                    </div>
                    <Card>
                        <div className="w-full mb-4 flex justify-center items-center">
                            <div className="mr-2">
                                <DictionaryIconLink
                                    linkUrl={`mkdictionaries:///?text=${
                                        term?.lookUp ? term.lookUp : term?.term
                                    }`}
                                    imgPath={dictionariesImg}
                                />
                            </div>
                            <div className="mr-2">
                                <DictionaryIconLink
                                    linkUrl={`https://www.urbandictionary.com/define.php?term=${
                                        term?.lookUp ? term.lookUp : term?.term
                                    }`}
                                    imgPath={urbandictionaryImg}
                                    openNewWindow={true}
                                />
                            </div>
                            <div>
                                <DictionaryIconLink
                                    linkUrl={`https://www.macmillandictionary.com/us/dictionary/american/${
                                        term?.lookUp ? term.lookUp : term?.term
                                    }`}
                                    imgPath={macmillanImg}
                                    openNewWindow={true}
                                />
                            </div>
                            <Button
                                className="p-button-text p-button-outlined ml-4"
                                icon={`pi ${
                                    pronouncing
                                        ? "pi-volume-off"
                                        : "pi-volume-up"
                                }`}
                                onClick={() =>
                                    tempPronounce(
                                        (term?.pronounce
                                            ? term.pronounce
                                            : term?.term) || ""
                                    )
                                }
                            />
                            <Button
                                className="p-button-text p-button-outlined ml-2"
                                icon="pi pi-reply"
                                onClick={() =>
                                    navigate("/view", {
                                        state: { id: term?.id },
                                    })
                                }
                            />
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
                        <div className="w-full mb-4 flex justify-center py-4">
                            <p
                                className="text-2xl font-semibold cursor-pointer"
                                onClick={() => copy(term?.term || "")}
                            >
                                {term?.term}
                            </p>
                        </div>
                        <div className="w-full mb-4">
                            <div>
                                <span className="font-semibold mr-2">
                                    Look up:
                                </span>
                                <span
                                    className="cursor-pointer"
                                    onClick={() => copy(term?.lookUp || "")}
                                >
                                    {term?.lookUp}
                                </span>
                            </div>
                            <div>
                                <span className="font-semibold mr-2">
                                    Pronounce:
                                </span>
                                <span
                                    className="cursor-pointer"
                                    onClick={() => copy(term?.pronounce || "")}
                                >
                                    {term?.pronounce}
                                </span>
                            </div>
                        </div>
                        <div className="w-full mb-4 flex justify-center max-h-64">
                            <ScrollPanel className="w-full max-h-64 rounded-md border border-gray-200">
                                <div
                                    className="ql-editor break-all p-6"
                                    dangerouslySetInnerHTML={{
                                        __html: term?.note || "",
                                    }}
                                />
                            </ScrollPanel>
                        </div>
                        <div className="mb-6">
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
                        <div>
                            <div>
                                {term?.tags.map((tag, i) => (
                                    <Tag
                                        key={i}
                                        value={tag.tag}
                                        className="mr-1"
                                    ></Tag>
                                ))}
                            </div>
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
                                Don't pronounce when videos play
                            </label>
                            <InputSwitch
                                checked={dontPronounceWhenVideosPlay}
                                onChange={(e) => {
                                    setDontPronounceWhenVideosPlay(e.value);
                                    setValue(
                                        "dontPronounceWhenVideosPlay",
                                        e.value
                                    );
                                }}
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
