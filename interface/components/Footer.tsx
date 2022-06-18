import { ipcRenderer } from "electron";
import { SpeedDial } from "primereact/speeddial";
import React, { ReactNode, useState } from "react";

import { getValue, setValue } from "../../shared/local_store";
import "../styles/footer.scss";

type FooterProps = {
    children?: ReactNode;
};

export const Footer = (props: FooterProps) => {
    const initialAlwaysOnTop = getValue("alwaysOnTop", false);

    const [alwaysOnTop, setAlwaysOnTop] = useState<boolean>(initialAlwaysOnTop);

    const changeAlwaysOnTop = () => {
        setValue("alwaysOnTop", !alwaysOnTop);
        setAlwaysOnTop(!alwaysOnTop);
        ipcRenderer.send("toggleAlwaysOnTop");
    };

    const items = [
        {
            label: "",
            icon: `pi ${alwaysOnTop ? "pi-circle-on" : "pi-circle-off"}`,
            command: () => {
                changeAlwaysOnTop();
            },
        },
    ];

    return (
        <div className="fixed bottom-0 right-0 w-full flex justify-between p-4 bg-zinc-50">
            <div>
                <SpeedDial model={items} />
            </div>
            <div>{props.children}</div>
        </div>
    );
};
