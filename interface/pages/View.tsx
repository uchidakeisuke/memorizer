import { format } from "date-fns";
import { IpcRendererEvent, ipcRenderer } from "electron";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Fieldset } from "primereact/fieldset";
import { Tag } from "primereact/tag";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { GetTermRequestData, ipcRendererSend } from "../../app/ipc/request";
import { GetTermResponse } from "../../app/ipc/response";
import { Term } from "../../app/typeorm/entities";
import { ShowMessage } from "../App";
import { Footer, YoutubeGallery } from "../components";
import { DictionaryIconLink } from "../components";
// @ts-ignore
import dictionariesImg from "../dictionary_icons/dictionaries.png";
// @ts-ignore
import macmillanImg from "../dictionary_icons/macmillan.png";
// @ts-ignore
import urbandictionaryImg from "../dictionary_icons/urbandictionary.png";
import { successSummary } from "../messages";
import "../styles/galleria.css";

type ViewProps = {
    showMessage: ShowMessage;
};

export const View = (props: ViewProps) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [term, setTerm] = useState<Term | null>(null);

    const [collapsedStates, setCollapsedStates] = useState<boolean[]>([
        false,
        true,
        true,
        true,
        true,
        true,
        true,
    ]);

    const didGetTerm = (event: IpcRendererEvent, args: GetTermResponse) => {
        const term = args.data;
        setTerm(term);
    };

    useEffect(() => {
        ipcRenderer.on("didGetTerm", didGetTerm);
        const updateSucceeded = (location.state as { updateSucceeded: boolean })
            .updateSucceeded;
        if (updateSucceeded) {
            props.showMessage("success", successSummary, "A term was updated");
        }
        return () => {
            ipcRenderer.off("didGetTerm", didGetTerm);
        };
    }, []);

    useEffect(() => {
        const termId = (location.state as { id: number }).id;
        if (termId) {
            ipcRendererSend<GetTermRequestData>("getTerm", {
                id: termId,
            });
        }
    }, [location.state]);

    const collapseAll = () => {
        const newCollapsedStates = Array(collapsedStates.length).fill(true);
        setCollapsedStates(newCollapsedStates);
    };

    const expandAll = () => {
        const newCollapsedStates = Array(collapsedStates.length).fill(false);
        setCollapsedStates(newCollapsedStates);
    };

    const onToggle = (i: number, collapsed: boolean) => {
        const newCollapsedStates = [...collapsedStates];
        newCollapsedStates[i] = collapsed;
        setCollapsedStates(newCollapsedStates);
    };

    const onClickEdit = () => {
        navigate("/edit", { state: { id: term?.id } });
    };

    return (
        <div className="mb-20">
            <Card>
                <div className="flex mb-4 justify-between">
                    <div className="flex">
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
                    <div className="flex justify-end">
                        <Button
                            icon="pi pi-plus"
                            className="p-button-outlined mr-2"
                            onClick={expandAll}
                        />
                        <Button
                            icon="pi pi-minus"
                            className="p-button-outlined"
                            onClick={collapseAll}
                        />
                    </div>
                </div>
                <div className="field mb-4">
                    <Fieldset
                        legend="Term"
                        toggleable
                        collapsed={collapsedStates[0]}
                        onToggle={(e) => onToggle(0, e.value)}
                    >
                        <div>{term?.term}</div>
                    </Fieldset>
                </div>
                <div className="field mb-4">
                    <Fieldset
                        legend="Note"
                        toggleable
                        collapsed={collapsedStates[1]}
                        onToggle={(e) => onToggle(1, e.value)}
                    >
                        <div
                            className="ql-editor"
                            dangerouslySetInnerHTML={{
                                __html: term?.note || "",
                            }}
                        />
                    </Fieldset>
                </div>
                <div className="field mb-4">
                    <Fieldset
                        legend="YouTube Videos"
                        toggleable
                        collapsed={collapsedStates[2]}
                        onToggle={(e) => onToggle(2, e.value)}
                    >
                        <YoutubeGallery
                            videos={term?.videos || []}
                            autoplay={false}
                        />
                    </Fieldset>
                </div>
                <div className="field mb-4">
                    <Fieldset
                        legend="Tags"
                        toggleable
                        collapsed={collapsedStates[3]}
                        onToggle={(e) => onToggle(3, e.value)}
                    >
                        <div>
                            {term?.tags.map((tag, i) => (
                                <Tag
                                    key={i}
                                    value={tag.tag}
                                    className="mr-1"
                                ></Tag>
                            ))}
                        </div>
                    </Fieldset>
                </div>
                <div className="field mb-4">
                    <Fieldset
                        legend="Status"
                        toggleable
                        collapsed={collapsedStates[4]}
                        onToggle={(e) => onToggle(4, e.value)}
                    >
                        <div>{term?.memory.status}</div>
                    </Fieldset>
                </div>
                <div className="field mb-4">
                    <Fieldset
                        legend="Suspend"
                        toggleable
                        collapsed={collapsedStates[5]}
                        onToggle={(e) => onToggle(5, e.value)}
                    >
                        <div>
                            {term?.memory.suspend
                                ? format(
                                      term?.memory.suspend,
                                      "yyyy/MM/dd HH:mm:ss XXX"
                                  )
                                : "????"}
                        </div>
                    </Fieldset>
                </div>
            </Card>
            <Footer>
                <Button label="Edit" onClick={onClickEdit} />
            </Footer>
        </div>
    );
};
