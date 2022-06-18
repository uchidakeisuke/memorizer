import { ipcRenderer } from "electron";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Fieldset } from "primereact/fieldset";
import React, { useState } from "react";

import { ShowMessage } from "../App";

type PreferencesProps = {
    showMessage: ShowMessage;
};

export const Preferences = (props: PreferencesProps) => {
    const [collapsedStates, setCollapsedStates] = useState<boolean[]>([true]);

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

    const downloadDb = () => {
        ipcRenderer.send("downloadDb");
    };

    return (
        <div>
            <Card>
                <div className="flex justify-end mb-4">
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
                {/* <div className="flex justify-end mb-4 w-full">
                    <Fieldset
                        legend="Download DB"
                        toggleable
                        onToggle={(e) => onToggle(0, e.value)}
                        collapsed={collapsedStates[0]}
                        className="w-full"
                    >
                        <Button icon="pi pi-download" onClick={downloadDb} />
                    </Fieldset>
                </div> */}
            </Card>
        </div>
    );
};
