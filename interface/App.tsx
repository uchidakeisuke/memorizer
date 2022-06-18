import { ipcRenderer } from "electron";
import "primeicons/primeicons.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/tailwind-light/theme.css";
import { Toast, ToastSeverityType } from "primereact/toast";
import React, { ReactNode, useRef } from "react";
import { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import "tailwindcss";

import { Layout } from "./components";
import { AddOrEdit, List, Play, Preferences, View } from "./pages";
import "./tailwind.css";

export type ShowMessage = (
    severity: ToastSeverityType,
    summary: ReactNode,
    message: ReactNode,
    life?: number
) => void;

const App = () => {
    const navigate = useNavigate();
    const toast = useRef(null);

    const openAddTerm = () => {
        navigate("/add", { state: { focus: true } });
    };

    useEffect(() => {
        navigate("/add");
        ipcRenderer.on("openAddTerm", openAddTerm);
        return () => {
            ipcRenderer.off("openAddTerm", openAddTerm);
        };
    }, []);

    const showMessage: ShowMessage = (
        severity,
        summary,
        message,
        life = 3000
    ) => {
        const toastRef = toast.current as {
            show: Toast["show"];
            clear: Toast["clear"];
        } | null;
        toastRef?.show({
            severity: severity,
            summary: summary,
            detail: message,
            life: life,
        });
    };

    return (
        <React.Fragment>
            <Layout>
                <Routes>
                    <Route
                        path="/add"
                        element={<AddOrEdit showMessage={showMessage} />}
                    />
                    <Route
                        path="/edit"
                        element={<AddOrEdit showMessage={showMessage} />}
                    />
                    <Route
                        path="/view"
                        element={<View showMessage={showMessage} />}
                    />
                    <Route
                        path="/play"
                        element={<Play showMessage={showMessage} />}
                    />
                    <Route
                        path="/list"
                        element={<List showMessage={showMessage} />}
                    />
                    <Route
                        path="/preferences"
                        element={<Preferences showMessage={showMessage} />}
                    />
                </Routes>
            </Layout>
            <Toast ref={toast} />
        </React.Fragment>
    );
};

export default App;
