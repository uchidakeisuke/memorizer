import React from "react";

import "../styles/dictionaryiconlink.scss";

type DictionaryIconLinkProps = {
    linkUrl: string;
    imgPath: string;
    openNewWindow?: boolean;
};

export const DictionaryIconLink = (props: DictionaryIconLinkProps) => {
    return (
        <a
            href={props.linkUrl}
            target={props.openNewWindow ? "_blank" : "_self"}
            rel="noreferrer"
        >
            <img src={props.imgPath} className="dictionary-icon" />
        </a>
    );
};
