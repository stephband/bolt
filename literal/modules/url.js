function countUpLevels(path) {
    let n = -1;
    while(path[++n] === '..');
    return n;
}

function rootPath(source, asset) {
    const sourcePath = source.split('/');
    var assetPath    = asset.split('/');

    // Remove file name in last position
    --sourcePath.length;

    // Remove leading ./
    if (assetPath[0] === '.') {
        assetPath.shift();
    }

    // Count up levels ../
    const count = countUpLevels(assetPath);
    const upCount = Math.min(count, sourcePath.length);

    // Make assetPath by stripping up levels and prepending what's 
    // left of sourcePath
    sourcePath.length -= upCount;
    assetPath.splice(0, upCount);
    return sourcePath.concat(assetPath);
}

export function rootURL(source, asset) {    
    return rootPath(source, asset).join('/');
}

const rurl = /(src=['"]?|href=['"]?|url\(\s*['"]?)([:.\/\w-\d%?]+)/g;

export function rewriteURL(source, target, asset) {
    const assetPath  = rootPath(source, asset);
    const targetPath = target.split('/');

    // Remove file name in last position
    --targetPath.length;

    // Strip leading levels that match targetPath
    let n = -1;
    while (assetPath[0] === targetPath[++n]) {
        assetPath.shift();
    }
    
    // Replace remaining target levels with ../
    --n;
    while (targetPath[++n]) {
        assetPath.unshift('..');
    }

    return assetPath.join('/');
}

//            1 src=" or href=" or url('                                2 anything not beginning with a / or #
const rURL = /(src=['"]?\s*|href=['"]?\s*|url\(\s*['"]?)(?:[a-z]+\:\/\/|([^\/\#'"][\:\.\/\w-\d\%]*))/g;

export function rewriteURLs(source, target, text) {
    // Check for $2 - if a protocol was found $2 is undefined and we don't 
    // want to rewrite. Todo: write the regexp to not match protocol:// urls  
    return text.replace(rURL, ($0, $1, $2) => (
        $2 ? $1 + rewriteURL(source, target, $2) : $0
    ));
}

