
export const reset      = "\x1b[0m%s\x1b[0m";
export const bright     = "\x1b[1m%s\x1b[0m";
export const dim        = "\x1b[2m%s\x1b[0m";
export const underscore = "\x1b[4m%s\x1b[0m";
export const blink      = "\x1b[5m%s\x1b[0m";
export const reverse    = "\x1b[7m%s\x1b[0m";
export const hidden     = "\x1b[8m%s\x1b[0m";

export const black     = "\x1b[30m%s\x1b[0m";
export const red       = "\x1b[31m%s\x1b[0m";
export const green     = "\x1b[32m%s\x1b[0m";
export const yellow    = "\x1b[33m%s\x1b[0m";
export const blue      = "\x1b[34m%s\x1b[0m";
export const magenta   = "\x1b[35m%s\x1b[0m";
export const cyan      = "\x1b[36m%s\x1b[0m";
export const white     = "\x1b[37m%s\x1b[0m";

export const bgBlack   = "\x1b[40m%s\x1b[0m";
export const bgRed     = "\x1b[41m%s\x1b[0m";
export const bgGreen   = "\x1b[42m%s\x1b[0m";
export const bgYellow  = "\x1b[43m%s\x1b[0m";
export const bgBlue    = "\x1b[44m%s\x1b[0m";
export const bgMagenta = "\x1b[45m%s\x1b[0m";
export const bgCyan    = "\x1b[46m%s\x1b[0m";
export const bgWhite   = "\x1b[47m%s\x1b[0m";

export const dimred     = dim + ' ' + red;
export const dimgreen   = dim + ' ' + green;
export const dimyellow  = dim + ' ' + yellow;
export const dimblue    = dim + ' ' + blue;
export const dimmagenta = dim + ' ' + magenta;
export const dimcyan    = dim + ' ' + cyan;

export const dimreddim     = dim + ' ' + red + ' ' + dim;
export const dimgreendim   = dim + ' ' + green + ' ' + dim;
export const dimyellowdim  = dim + ' ' + yellow + ' ' + dim;
export const dimbluedim    = dim + ' ' + blue + ' ' + dim;
export const dimmagentadim = dim + ' ' + magenta + ' ' + dim;
export const dimcyandim    = dim + ' ' + cyan + ' ' + dim;

export const redwhitedim    = red + ' ' + white + ' ' + dim;