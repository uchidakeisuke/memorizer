export const suspendTime: { [key: number]: { unit: string; suspend: number } } =
    {
        1: {
            unit: "minute",
            suspend: 20,
        },
        2: {
            unit: "hour",
            suspend: 1,
        },
        3: {
            unit: "day",
            suspend: 1,
        },
        4: {
            unit: "day",
            suspend: 7,
        },
        5: {
            unit: "month",
            suspend: 1,
        },
        6: {
            unit: "year",
            suspend: 1,
        },
    };
