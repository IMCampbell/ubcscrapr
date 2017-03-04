const scrapeRS = require("./roomSlotScrapr");
const scrapeBuildings = require("./buildingScrapr");

/**
 * Returns an object containing all class sections with their weekday, time, room, building, and address
 * @param semester: the semester that the classes belong to
 * @param minRequestSpace: the minimum amount of time between requests to UBCs webserver in milliseconds
 * @param verbose: whether or not you want to see console.logs
 * @param departments: an optional list that if present will tell the scrapr to only scrape the given departments
 */
function getRoomSlots (semester, minRequestSpace = 1000, verbose = false, departments = []) {
    validateInput("semester", semester, [1, 2], "set");
    validateInput("minRequestSpace", minRequestSpace, [0, 100000], "range");
    validateInput("verbose", verbose, [true, false], "set");
    validateInput("departments", departments, "Array", "type");
    return scrapeRS(semester, verbose, minRequestSpace, departments);
};

/**
 * Gets the hours for all buildings listed on the Buildings and classrooms section of the student services page
 * @param verbose: whether or not you want to see console.logs
 * @param minRequestSpace: the minimum amount of time between requests to UBCs webserver in milliseconds
 */
function getHours (verbose = false, minRequestSpace = 500) {
    validateInput("verbose", verbose, [true, false], "set");
    validateInput("minRequestSpace", minRequestSpace, [0, 100000], "range");
    return scrapeBuildings(verbose, minRequestSpace);
}
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
