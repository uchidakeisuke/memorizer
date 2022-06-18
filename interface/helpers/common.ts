// shaffle array's items
export const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const convertStringTimeToSeconds = (stringTime: string) => {
    const numbers = stringTime.split(":");
    const hours = numbers.length === 3 ? parseInt(numbers[0]) : 0;
    const minutes =
        numbers.length === 3 ? parseInt(numbers[1]) : parseInt(numbers[0]);
    let seconds =
        numbers.length === 3 ? parseInt(numbers[2]) : parseInt(numbers[1]);
    seconds += minutes * 60 + hours * 3600;
    return seconds;
};

export const extractYoutubeVideoIdFromUrl = (youtubeUrl: string) => {
    const regExp =
        /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = youtubeUrl.match(regExp);
    return match && match[7].length == 11 ? match[7] : false;
};
