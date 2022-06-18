import { Tag, Term } from "../typeorm/entities";

export type AddTermResponse = {
    result: boolean;
    data: Term | null;
};

export type GetTermResponse = {
    result: boolean;
    data: Term | null;
};

export type UpdateTermResponse = {
    result: boolean;
    data: Term | null;
};

export type GetAllTermsResponse = {
    result: boolean;
    data: Term[] | null;
};

export type DeleteTermsResponse = {
    result: boolean;
};

export type GetAllTagsResponse = {
    result: boolean;
    data: Tag[] | null;
};

export type GetTargetTermsResponse = {
    result: boolean;
    data: Term[] | null;
};

export type UpdateStatusAndSuspendResponse = {
    result: boolean;
    data: Term;
};
