import React from "react";

export const EditorHeader = (
    <React.Fragment>
        <span className="ql-formats" tabIndex={-1}>
            <select
                className="ql-header ql-picker ql-toolbar-item"
                tabIndex={-1}
            >
                <option value="0" tabIndex={-1}></option>
                <option value="1" tabIndex={-1}></option>
                <option value="2" tabIndex={-1}></option>
            </select>
        </span>
        <span className="ql-formats" tabIndex={-1}>
            <button
                type="button"
                className="ql-bold ql-toolbar-item"
                tabIndex={-1}
            ></button>
            <button
                type="button"
                className="ql-italic ql-toolbar-item"
                tabIndex={-1}
            ></button>
            <button
                type="button"
                className="ql-underline ql-toolbar-item"
                tabIndex={-1}
            ></button>
            <button
                type="button"
                className="ql-strike ql-toolbar-item"
                tabIndex={-1}
            ></button>
        </span>
        <span className="ql-formats" tabIndex={-1}>
            <select
                className="ql-color ql-picker ql-color-picker ql-toolbar-item"
                tabIndex={-1}
            >
                <option value="black" tabIndex={-1}></option>
                <option value="white" tabIndex={-1}></option>
                <option value="red" tabIndex={-1}></option>
                <option value="blue" tabIndex={-1}></option>
                <option value="yellow" tabIndex={-1}></option>
            </select>
            <select
                className="ql-background ql-picker ql-color-picker ql-toolbar-item"
                tabIndex={-1}
            >
                <option value="black" tabIndex={-1}></option>
                <option value="white" tabIndex={-1}></option>
                <option value="red" tabIndex={-1}></option>
                <option value="blue" tabIndex={-1}></option>
                <option value="yellow" tabIndex={-1}></option>
            </select>
        </span>
        <span className="ql-formats" tabIndex={-1}>
            <button
                type="button"
                className="ql-list ql-toolbar-item"
                value="ordered"
                tabIndex={-1}
            ></button>
            <button
                type="button"
                className="ql-list ql-toolbar-item"
                value="bullet"
                tabIndex={-1}
            ></button>
            <select
                className="ql-align ql-picker ql-icon-picker ql-toolbar-item"
                tabIndex={-1}
            >
                <option value="" tabIndex={-1}></option>
                <option value="center" tabIndex={-1}></option>
                <option value="right" tabIndex={-1}></option>
                <option value="justify" tabIndex={-1}></option>
            </select>
        </span>
        <span className="ql-formats" tabIndex={-1}>
            <button
                type="button"
                className="ql-blockquote ql-toolbar-item"
                tabIndex={-1}
            ></button>
            <button
                type="button"
                className="ql-code-block ql-toolbar-item"
                tabIndex={-1}
            ></button>
        </span>
        <span className="ql-formats" tabIndex={-1}>
            <button
                type="button"
                className="ql-link ql-toolbar-item"
                tabIndex={-1}
            ></button>
            <button
                type="button"
                className="ql-image ql-toolbar-item"
                tabIndex={-1}
            ></button>
            <button
                type="button"
                className="ql-video ql-toolbar-item"
                tabIndex={-1}
            ></button>
        </span>
        <span className="ql-formats" tabIndex={-1}>
            <button
                type="button"
                className="ql-clean ql-toolbar-item"
                tabIndex={-1}
            ></button>
        </span>
    </React.Fragment>
);
