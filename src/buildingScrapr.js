const cheerio = require('cheerio');
const request = require("request");
const space = require("./requestSpacer");
const log = require("./logger");
const utils = require("./utils");

module.exports = function scrapeBuildings(verbose, minRequestSpace) {
    let buildings = [];
    const reqUrl = 'https://students.ubc.ca/campus-life/organizing-campus-events/book-event-space/buildings-classrooms';
    return new Promise(
        function(resolve, reject) {
            space(minRequestSpace);
            request(reqUrl, function (error, response, body) {
                log.logCount('buildlist', verbose);
                if (!error && response.statusCode == 200) {
                    const buildingIDs = utils.getListOfChildren("buildingID", body);
                    const promises = [];
                    buildingIDs.forEach(function (buildingID) {
                            promises.push(parseBuilding(buildingID, verbose, minRequestSpace));
                    });
                    Promise.all(promises).then(function(returnObjectArray) {
                        log.printCounts(verbose);
                        resolve(returnObjectArray);
                    });
                } else {
                    reject(error);
                }
            });
        }
    );
};

function parseBuilding(buildingID, verbose, minRequestSpace) {
    const roomSlots = [];
    const reqUrl = 'https://students.ubc.ca/campus-life/organizing-campus-events/book-event-space/buildings-classrooms/' + buildingID;
    return new Promise(
        function(resolve, reject) {
            space(minRequestSpace);
            request(reqUrl, function (error, response, body) {
                log.logCount('Hours', verbose);
                if (!error && response.statusCode == 200) {
                    $ = cheerio.load(body);
                    let hours = '';
                    let address = '';
                    const maybeHoursObject = $('.building-comment')[0]['children'][0];
                    const maybeAddressObject = $('.building-address')[0]['children'][0];
                    if (typeof maybeHoursObject !== 'undefined') {
                        hours = maybeHoursObject['data'];
                    }
                    if (typeof maybeAddressObject !== 'undefined') {
                        address = maybeAddressObject['data'];
                    }
                    const returnObject = {
                        'hours' : hours,
                        'address' : address,
                        'buildingID' : buildingID
                    };
                    resolve(returnObject);
                } else {
                    reject(error);
                }
            });
        }

    );
}