import { addDays, addHours, addMinutes, addMonths, addYears } from "date-fns";
import { zonedTimeToUtc } from "date-fns-tz";
import {
    FindOptionsWhere,
    In,
    InsertResult,
    LessThanOrEqual,
    UpdateResult,
} from "typeorm";

import { suspendTime } from "../constants";
import { dataSource } from "../typeorm";
import { Memory, Tag, Term, Video } from "../typeorm/entities";

const isValidYoutubeVideo = (url: string, start: string, end: string) => {
    if (
        url.indexOf("https://www.youtube.com") >= 0 &&
        start.match(/(\d{1,2}:)?\d{1,2}:\d{2}?/gm) &&
        end.match(/(\d{1,2}:)?\d{1,2}:\d{2}?/gm)
    ) {
        return true;
    }
    return false;
};

export const createTerm = async ({
    term,
    note = "",
    videos = [],
    tags = [],
}: {
    term: Term["term"];
    note?: Term["note"];
    videos?: { url: Video["url"]; start: Video["start"]; end: Video["end"] }[];
    tags?: Tag["tag"][];
}): Promise<{
    term: InsertResult;
    videos: InsertResult;
    tags: InsertResult;
    memory: InsertResult;
}> => {
    return new Promise(async (resolve, reject) => {
        try {
            const termRepository = dataSource.getRepository(Term);
            const termResult = await termRepository.insert({
                term: term,
                note: note,
            });

            const termId = termResult.identifiers[0].id;
            const videosToInsert = videos
                .filter((video) =>
                    isValidYoutubeVideo(video.url, video.start, video.end)
                )
                .map((video, index) => {
                    return { ...video, order: index, term: termId };
                });
            const videosResult = await dataSource
                .createQueryBuilder()
                .insert()
                .into(Video)
                .values(videosToInsert)
                .execute();

            const tagsToInsert = tags.map((tag) => {
                return { tag: tag, term: termId };
            });
            const tagsResult = await dataSource
                .createQueryBuilder()
                .insert()
                .into(Tag)
                .values(tagsToInsert)
                .execute();

            const memoryRepository = dataSource.getRepository(Memory);
            const memoryResult = await memoryRepository.insert({
                term: termId,
            });

            resolve({
                term: termResult,
                videos: videosResult,
                tags: tagsResult,
                memory: memoryResult,
            });
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
};

export const updateTerm = async ({
    id,
    term,
    note,
    videos,
    tags,
}: {
    id: Term["id"];
    term?: Term["term"];
    note?: Term["note"];
    videos?: { url: Video["url"]; start: Video["start"]; end: Video["end"] }[];
    tags?: Tag["tag"][];
}): Promise<{
    term: UpdateResult | null;
    videos: UpdateResult | null;
    tags: UpdateResult | null;
}> => {
    return new Promise(async (resolve, reject) => {
        try {
            let termResult: UpdateResult | null = null;
            if (
                (term !== null && term !== undefined) ||
                (note !== null && note !== undefined)
            ) {
                const termRepository = dataSource.getRepository(Term);
                termResult = await termRepository.update(
                    { id: id },
                    { term, note }
                );
            }

            let videosResult: InsertResult | null = null;
            if (
                videos !== undefined &&
                videos !== null &&
                Array.isArray(videos)
            ) {
                const videosToInsert = videos
                    .filter((video) =>
                        isValidYoutubeVideo(video.url, video.start, video.end)
                    )
                    .map((video, index) => {
                        return { ...video, order: index, term: { id: id } };
                    });
                const videoRepository = dataSource.getRepository(Video);
                await videoRepository.delete({ term: { id: id } });
                videosResult = await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Video)
                    .values(videosToInsert)
                    .execute();
            }

            let tagsResult: InsertResult | null = null;
            if (tags !== undefined && tags !== null && Array.isArray(tags)) {
                const tagsToInsert = tags.map((tag) => {
                    return { tag: tag, term: { id: id } };
                });
                const tagRepository = dataSource.getRepository(Tag);
                await tagRepository.delete({ term: { id: id } });
                tagsResult = await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Tag)
                    .values(tagsToInsert)
                    .execute();
            }

            resolve({
                term: termResult,
                videos: videosResult,
                tags: tagsResult,
            });
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
};

export const getTermById = async (id: Term["id"]): Promise<Term | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            const termRepository = dataSource.getRepository(Term);
            const termResult = await termRepository.findOne({
                where: { id: id },
                relations: { memory: true, videos: true, tags: true },
            });
            resolve(termResult);
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
};

export const getTermByIds = async (
    ids: Term["id"][]
): Promise<Term[] | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            const termRepository = dataSource.getRepository(Term);
            const termResult = await termRepository.find({
                where: { id: In(ids) },
                relations: { memory: true, videos: true, tags: true },
            });
            resolve(termResult);
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
};

export const deleteTerms = async (ids: Term["id"][]) => {
    return new Promise(async (resolve, reject) => {
        try {
            const memoryRepository = dataSource.getRepository(Memory);
            const deletedMemory = await memoryRepository.delete({
                term: { id: In(ids) },
            });
            const videosRepository = dataSource.getRepository(Video);
            const deletedVideos = await videosRepository.delete({
                term: { id: In(ids) },
            });
            const deletedTerms = await dataSource
                .getRepository(Term)
                .delete(ids);

            resolve({
                term: deletedTerms,
                videos: deletedVideos,
                memory: deletedMemory,
            });
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
};

export const updateStatus = async (termId: Term["id"], nextStatus: number) => {
    return new Promise(async (resolve, reject) => {
        try {
            const time = suspendTime[nextStatus];
            const unit = time.unit;
            let suspend = new Date();

            switch (unit) {
                case "minute": {
                    suspend = addMinutes(suspend, time.suspend);
                    break;
                }
                case "hour": {
                    suspend = addHours(suspend, time.suspend);
                    break;
                }
                case "day": {
                    suspend = addDays(suspend, time.suspend);
                    break;
                }
                case "month": {
                    suspend = addMonths(suspend, time.suspend);
                    break;
                }
                case "year": {
                    suspend = addYears(suspend, time.suspend);
                    break;
                }
            }
            const memoryRepository = dataSource.getRepository(Memory);
            const result = memoryRepository.update(
                { term: { id: termId } },
                { status: nextStatus, suspend: suspend }
            );
            resolve(result);
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
};

export const updateSuspend = async (termId: Term["id"], suspend: Date) => {
    return new Promise(async (resolve, reject) => {
        try {
            const memoryRepository = dataSource.getRepository(Memory);
            const result = await memoryRepository.update(
                { id: termId },
                { suspend: suspend }
            );
            resolve(result);
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
};

export const getAllTerms = async (): Promise<Term[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const termRepository = dataSource.getRepository(Term);
            const allTerms = await termRepository.find({
                order: { id: "DESC" },
            });
            resolve(allTerms);
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
};

export const getAllTags = async (): Promise<Tag[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const tagsRepository = dataSource.getRepository(Tag);
            const allTags = await tagsRepository.find();
            resolve(allTags);
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
};

type GetTargetTermsParams = {
    untilOrEqual?: Date | null;
    tags?: Tag["tag"][] | null;
    status?: Memory["status"][] | null;
};

export const getTargetTerms = async (
    filter: GetTargetTermsParams
): Promise<Term[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const untilOrEqual = filter.untilOrEqual || undefined;
            const tags = filter.tags || undefined;
            let status = filter.status || [1, 2, 3, 4, 5, 6];
            status =
                Array.isArray(status) && !status.length
                    ? [1, 2, 3, 4, 5, 6]
                    : status;
            const termRepository = dataSource.getRepository(Term);
            const where: FindOptionsWhere<Term> = {};
            if (untilOrEqual !== undefined && untilOrEqual !== null) {
                where.memory = {
                    status: In(status),
                    suspend: LessThanOrEqual(untilOrEqual),
                };
            } else {
                where.memory = {
                    status: In(status),
                };
            }
            if (
                tags !== undefined &&
                tags !== null &&
                Array.isArray(tags) &&
                tags.length
            ) {
                where.tags = { tag: In(tags) };
            }
            const targetTerms = await termRepository.find({
                where: where,
                relations: { videos: true, tags: true, memory: true },
            });
            resolve(targetTerms);
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
};
