import React from "react";

export const EditorHeader = (
    <React.Fragment>
        <span className="ql-formats">
            <select
                className="ql-header ql-picker ql-toolbar-item"
                tabIndex={-1}
            >
                <option value="0"></option>
                <option value="1"></option>
                <option value="2"></option>
            </select>
        </span>
        <span className="ql-formats">
            <button type="button" className="ql-bold ql-toolbar-item"></button>
            <button
                type="button"
                className="ql-italic ql-toolbar-item"
            ></button>
            <button
                type="button"
                className="ql-underline ql-toolbar-item"
            ></button>
            <button
                type="button"
                className="ql-strike ql-toolbar-item"
            ></button>
        </span>
        <span className="ql-formats">
            <select className="ql-color ql-picker ql-color-picker ql-toolbar-item">
                <option value="black"></option>
                <option value="white"></option>
                <option value="red"></option>
                <option value="blue"></option>
                <option value="yellow"></option>
            </select>
            <select className="ql-background ql-picker ql-color-picker ql-toolbar-item">
                <option value="black"></option>
                <option value="white"></option>
                <option value="red"></option>
                <option value="blue"></option>
                <option value="yellow"></option>
            </select>
        </span>
        <span className="ql-formats">
            <button
                type="button"
                className="ql-list ql-toolbar-item"
                value="ordered"
            ></button>
            <button
                type="button"
                className="ql-list ql-toolbar-item"
                value="bullet"
            ></button>
            <select className="ql-align ql-picker ql-icon-picker ql-toolbar-item">
                <option value=""></option>
                <option value="center"></option>
                <option value="right"></option>
                <option value="justify"></option>
            </select>
        </span>
        <span className="ql-formats">
            <button
                type="button"
                className="ql-blockquote ql-toolbar-item"
            ></button>
            <button
                type="button"
                className="ql-code-block ql-toolbar-item"
            ></button>
        </span>
        <span className="ql-formats">
            <button type="button" className="ql-link ql-toolbar-item"></button>
            <button type="button" className="ql-image ql-toolbar-item"></button>
            <button type="button" className="ql-video ql-toolbar-item"></button>
        </span>
        <span className="ql-formats">
            <button type="button" className="ql-clean ql-toolbar-item"></button>
        </span>
    </React.Fragment>
);
