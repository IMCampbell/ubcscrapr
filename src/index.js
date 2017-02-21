const scrapeRS = require("./roomSlotScrapr");

/**
 * Returns an object containing all class sections with their weekday, time, room, building, and address
 * @param semester: the semester that the classes belong to
 * @param minRequestSpace: the minimum amount of time between requests to UBCs webserver in miliseconds
 * @param verbose: whether or not you want to see console.logs
 * @param departments: an optional list that if present will tell the scrapr to only scrape the given departments
 */
exports.getRoomSlots = function (semester, minRequestSpace, verbose, departments) {
    if (!minRequestSpace) {
        minRequestSpace = 1000;
    }
    if (!verbose) {
        verbose = false;
    }
    if (!departments) {
        departments = [];
    }
    validateInput("term", semester, [1, 2], "set");
    validateInput("minRequestSpace", minRequestSpace, [0, 100000], "range");
    validateInput("verbose", verbose, [true, false], "set");
    validateInput("departments", departments, "Array", "type");
    return scrapeRS(semester, verbose, minRequestSpace, departments);
};

/**
 * Function to ensure that variables passed to API are of the correct types and bounded by reasonable values.
 * @param inputName: the name of the variable
 * @param input: the value of the variable
 * @param acceptableValues: parameter containing valid values for input to take
 * @param acceptableValueType: a flag
 *           range means that the acceptableValues is a list containing a min and a max value
 *           set means that the acceptableValues is a list containing all acceptable values
 *           type means that the acceptableValues is a single string containing the type that input must be
 */
function validateInput(inputName, input, acceptableValues, acceptableValueType) {
    let validInput = true;
    if (acceptableValueType == "range") {
        if (input < Math.min(...acceptableValues) || input > Math.max(...acceptableValues)) {
            validInput = false;
        }
    } else if (acceptableValueType == "set") {
        if (acceptableValues.indexOf(input) == -1) {
            validInput = false;
        }
    } else if (acceptableValueType == "type") {
        if (!typeof input == acceptableValues) {
            validInput = false;
        }
    }
    if (!validInput) {
        throw(`Invalid ${inputName} given, valid options are: ${acceptableValues}`);
    }
}