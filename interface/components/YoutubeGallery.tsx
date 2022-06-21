import { Button } from "primereact/button";
import { Galleria } from "primereact/galleria";
import React, { useState } from "react";

import { Video } from "../../app/typeorm/entities";
import {
    convertStringTimeToSeconds,
    extractYoutubeVideoIdFromUrl,
} from "../helpers/common";
import "../styles/galleria.css";

type YoutubeGalleryProps = {
    videos: Video[];
    activeIndex?: number;
    onItemChange?: (newActiveIndex: number) => void;
    autoplay?: boolean;
};

export const YoutubeGallery = (props: YoutubeGalleryProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [key, setKey] = useState(0);

    const itemTemplate = (video: Video) => {
        if (video && video.url && video.start && video.end) {
            const videoId = extractYoutubeVideoIdFromUrl(video.url);
            const start = convertStringTimeToSeconds(video.start);
            const end = convertStringTimeToSeconds(video.end);
            return (
                <div>
                    <iframe
                        height="200"
                        src={`https://www.youtube.com/embed/${videoId}?start=${start}&end=${end}&autoplay=${
                            props.autoplay ? "1" : "0"
                        }&loop=1`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        key={key}
                    ></iframe>
                    <Button
                        className="p-button-text absolute video-replay"
                        icon="pi pi-replay"
                        onClick={() => setKey(key + 1)}
                    />
                </div>
            );
        } else {
            return (
                <div>
                    <div className="empty-video"></div>
                    <Button
                        className="p-button-text absolute video-replay"
                        icon="pi pi-replay"
                        onClick={() => setKey(key + 1)}
                    />
                </div>
            );
        }
    };

    const thumbnailTemplate = (video: Video) => {
        const videoId = extractYoutubeVideoIdFromUrl(video.url);
        return (
            <img
                className="youtube-gallery-thumbnail"
                src={`https://img.youtube.com/vi/${videoId}/0.jpg`}
            />
        );
    };

    return (
        <React.Fragment>
            {props.videos.length ? (
                <Galleria
                    value={props.videos}
                    activeIndex={props.activeIndex || activeIndex}
                    onItemChange={(e) => {
                        if (
                            props.activeIndex !== null &&
                            props.activeIndex !== undefined &&
                            props.onItemChange !== undefined
                        ) {
                            props.onItemChange(e.index);
                        } else {
                            setActiveIndex(e.index);
                        }
                    }}
                    numVisible={3}
                    item={itemTemplate}
                    thumbnail={thumbnailTemplate}
                />
            ) : (
                <div></div>
            )}
        </React.Fragment>
    );
};
