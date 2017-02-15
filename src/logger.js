module.exports = function logParse(parsed, verbose) {
    if (verbose) {
        console.log(new Date(Date.now()), ", Parsed ", parsed);
    }
};