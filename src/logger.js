exports.logParse = function (parsed, verbose) {
    if (verbose) {
        console.log(new Date(Date.now()), ", Parsed ", parsed);
    }
};

let counts = {};

exports.logCount = function (page, verbose) {
    if (verbose) {
        if (counts.hasOwnProperty(page)) {
            counts[page]++;
        }
        else {
            counts[page] = 1;
        }
    }
};

exports.printCounts = function (verbose) {
    if (verbose) {
        console.log(JSON.stringify(counts));
    }
};