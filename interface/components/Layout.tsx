import { ipcRenderer } from "electron";
import { TabMenu, TabMenuTabChangeParams } from "primereact/tabmenu";
import React from "react";
import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { setValue } from "../../shared/local_store";
import "../styles/tabmenu.scss";

const pages: { [key: string]: { path: string } } = {
    add: { path: "/add" },
    play: { path: "/play" },
    list: { path: "/list" },
    preferences: { path: "/preferences" },
};

const menuItems = [
    { label: "Add", icon: "pi pi-fw pi-plus", key: "add" },
    { label: "Play", icon: "pi pi-fw pi-play", key: "play" },
    { label: "List", icon: "pi pi-fw pi-list", key: "list" },
    { label: "", icon: "pi pi-fw pi-cog", key: "preferences" },
];

type LayoutProps = {
    children: ReactNode;
};

export const Layout = (props: LayoutProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [activeIndex, setActiveIndex] = useState<number>(0);

    useEffect(() => {
        window.addEventListener("resize", onResizeWindow);
        return () => {
            window.removeEventListener("resize", onResizeWindow);
        };
    }, []);

    useEffect(() => {
        const path = location.pathname;
        const key = path.slice(1);
        if (key in pages) {
            const index = Object.keys(pages).indexOf(key);
            setActiveIndex(index);
        } else {
            setActiveIndex(-1);
        }
    }, [location.pathname]);

    const onResizeWindow = () => {
        const width = window.outerWidth;
        const height = window.outerHeight;
        setValue("width", width);
        setValue("height", height);
    };

    const onChangeTab = (e: TabMenuTabChangeParams) => {
        setActiveIndex(e.index);
        const key = (e.value as { label: string; icon: string; key: string })
            .key;
        const page = pages[key];
        navigate(page.path, { state: {} });
    };

    return (
        <div className="bg-zinc-50">
            <div className="p-4 fixed w-full z-10 bg-zinc-50">
                <TabMenu
                    model={menuItems}
                    activeIndex={activeIndex}
                    onTabChange={onChangeTab}
                    className="bg-zinc-50"
                />
            </div>
            <div className="p-4">
                <main className="mt-20">{props.children}</main>
            </div>
        </div>
    );
};
