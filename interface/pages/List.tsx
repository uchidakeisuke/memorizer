import { IpcRendererEvent, ipcRenderer } from "electron";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { ConfirmDialog } from "primereact/confirmdialog";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { InputText, InputTextProps } from "primereact/inputtext";
import { Toolbar } from "primereact/toolbar";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    DeleteTermsRequest,
    GetAllTermsRequest,
    ipcRendererSend,
} from "../../app/ipc/request";
import {
    DeleteTermsResponse,
    GetAllTermsResponse,
} from "../../app/ipc/response";
import { Term } from "../../app/typeorm/entities";
import { ShowMessage } from "../App";
import { Footer } from "../components";
import { errorSummary, successSummary } from "../messages";
import "../styles/datatable.css";
import "../styles/dialog.css";

type ListProps = {
    showMessage: ShowMessage;
};

export const List = (props: ListProps) => {
    const [terms, setTerms] = useState<Term[]>([]);
    const [globalFilter, setGlobalFilter] = useState<string | null>(null);
    const [selectedTerms, setSelectedTerms] = useState<Term[] | null>(null);

    const [isDialogVisible, setIsDialogVisible] = useState(false);

    const didGetAllTerms = (
        event: IpcRendererEvent,
        args: GetAllTermsResponse
    ) => {
        const data = args.data;
        if (data) {
            const allTerms = data || [];
            setTerms(allTerms);
        } else {
            props.showMessage("error", errorSummary, "Failed to get terms...");
        }
    };

    const didDeleteTerms = (
        event: IpcRendererEvent,
        args: DeleteTermsResponse
    ) => {
        const result = args.result;
        if (result) {
            props.showMessage("success", successSummary, "Deleted terms");
        } else {
            props.showMessage(
                "error",
                errorSummary,
                "Failed to delete terms..."
            );
        }
        ipcRendererSend<GetAllTermsRequest>("getAllTerms", {
            channel: "listDidGetAllTerms",
        });
        setSelectedTerms(null);
    };

    useEffect(() => {
        ipcRendererSend<GetAllTermsRequest>("getAllTerms", {
            channel: "listDidGetAllTerms",
        });
        ipcRenderer.on("listDidGetAllTerms", didGetAllTerms);
        ipcRenderer.on("listDidDeleteTerms", didDeleteTerms);
        return () => {
            ipcRenderer.off("listDidGetAllTerms", didGetAllTerms);
            ipcRenderer.off("listDidDeleteTerms", didDeleteTerms);
        };
    }, []);

    const deleteTerms = () => {
        const ids = (selectedTerms || [])
            .filter((term) => term?.id)
            .map((term) => term.id);
        if (!ids.length) return;
        ipcRendererSend<DeleteTermsRequest>("deleteTerms", {
            data: { ids: ids },
            channel: "listDidDeleteTerms",
        });
    };

    const accept = () => {
        deleteTerms();
    };

    const onInputHeaderSearch: InputTextProps["onInput"] = (e) => {
        const value = (e.target as HTMLInputElement).value;
        setGlobalFilter(value);
    };

    const onClickDeleteTerms = () => {
        setIsDialogVisible(true);
    };

    const header = (
        <div className="table-header flex justify-end">
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    onInput={onInputHeaderSearch}
                    placeholder="Search..."
                />
            </span>
        </div>
    );

    const leftToolbar = () => {
        return (
            <React.Fragment>
                <Button
                    label="Delete"
                    icon="pi pi-trash"
                    className="p-button-danger"
                    onClick={onClickDeleteTerms}
                    // disabled={!selectedTerms?.length}
                />
            </React.Fragment>
        );
    };

    const columnBody = (rowData: { id: number; term: string }) => {
        return (
            <div className="flex items-center justify-between">
                <Link
                    to={{ pathname: "/view" }}
                    state={{ id: rowData.id }}
                    className="text-blue-500"
                >
                    {rowData.term}
                </Link>
            </div>
        );
    };

    return (
        <div>
            <Card>
                <Toolbar className="mb-4" left={leftToolbar}></Toolbar>
                <DataTable
                    value={terms}
                    selection={selectedTerms}
                    onSelectionChange={(e) => setSelectedTerms(e.value)}
                    dataKey="id"
                    paginator
                    rows={10}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    globalFilter={globalFilter}
                    header={header}
                    responsiveLayout="scroll"
                    selectionPageOnly={true}
                >
                    <Column
                        selectionMode="multiple"
                        headerStyle={{ width: "3rem" }}
                        exportable={false}
                    ></Column>
                    <Column
                        field="term"
                        header="term"
                        filter
                        filterPlaceholder="Search by term"
                        body={columnBody}
                    />
                </DataTable>
                <ConfirmDialog
                    visible={isDialogVisible}
                    onHide={() => setIsDialogVisible(false)}
                    message={`Are you sure you want to delete ${
                        selectedTerms?.length || 0
                    } terms?`}
                    header="Delete the terms"
                    icon="pi pi-exclamation-triangle"
                    accept={accept}
                    onMaskClick={() => setIsDialogVisible(false)}
                />
            </Card>
            <Footer></Footer>
        </div>
    );
};
