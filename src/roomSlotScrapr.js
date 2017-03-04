const cheerio = require('cheerio');
const request = require("request");
const space = require("./requestSpacer");
const log = require("./logger");
const utils = require("./utils");

module.exports = function scrapeRoomSlots(term, verbose, minRequestSpace, deptsToScrape) {
    let roomSlots = [];
    const reqUrl = 'http://courses.students.ubc.ca/cs/main?pname=subjarea&tname=subjareas&req=0';
    return new Promise(
        function(resolve, reject) {
            space(minRequestSpace);
            request(reqUrl, function (error, response, body) {
                log.logCount('deptlist', verbose);
                if (!error && response.statusCode == 200) {
                    const depts = utils.getListOfChildren("dept", body);
                    const promises = [];
                    depts.forEach(function (dept) {
                        if (deptsToScrape.length == 0 || deptsToScrape.indexOf(dept) != -1) {
                            promises.push(parseDepartment(term, dept, verbose, minRequestSpace));
                        }
                    });
                    Promise.all(promises).then(function(returnSlotsArray) {
                        returnSlotsArray.forEach(function(returnSlots) {
                            roomSlots = roomSlots.concat(returnSlots);
                        });
                        log.printCounts(verbose);
                        resolve(roomSlots);
                    });
                } else {
                    reject(error);
                }
            });
        }
    );
};

function parseDepartment(term, dept, verbose, minRequestSpace) {
    let roomSlots = [];
    const reqUrl = 'http://courses.students.ubc.ca/cs/main?pname=subjarea&tname=subjareas&req=1&dept=' + dept;
    return new Promise(
        function(resolve, reject) {
            space(minRequestSpace);
            request(reqUrl, function (error, response, body) {
                log.logCount('department', verbose);
                if (!error && response.statusCode == 200) {
                    const courses = utils.getListOfChildren("course", body);
                    const promises = [];
                    courses.forEach(function (course) {
                        promises.push(parseCourse(term, dept, course, verbose, minRequestSpace));
                    });
                    Promise.all(promises).then(function(returnSlotsArray) {
                        returnSlotsArray.forEach(function(returnSlots) {
                            roomSlots = roomSlots.concat(returnSlots);
                        });
                        log.logParse(dept, verbose);
                        resolve(roomSlots);
                    });
                } else {
                    reject(error);
                }
            });
        }
    );
}

function parseCourse(term, dept, course, verbose, minRequestSpace) {
    let roomSlots = [];
    const reqUrl = 'http://courses.students.ubc.ca/cs/main?pname=subjarea&tname=subjareas&req=3&dept=' +
        dept + '&course=' + course;
    return new Promise(
        function(resolve, reject) {
            space(minRequestSpace);
            request(reqUrl, function (error, response, body) {
                log.logCount('course', verbose);
                if (!error && response.statusCode == 200) {
                    const sections = utils.getListOfSections(term, body);
                    const promises = [];
                    sections.forEach(function (section) {
                        promises.push(parseSection(dept, course, section, verbose, minRequestSpace));
                    });
                    Promise.all(promises).then(function(returnSlotsArray) {
                        returnSlotsArray.forEach(function(returnSlots) {
                            roomSlots = roomSlots.concat(returnSlots);
                        });
                        log.logParse(dept + " " + course, verbose);
                        resolve(roomSlots);
                    });
                } else {
                    reject(error);
                }
            });
        }
    );
}

let roomAddressDict = {};

function parseSection(dept, course, section, verbose, minRequestSpace) {
    const roomSlots = [];
    const reqUrl = 'https://courses.students.ubc.ca/cs/main?pname=subjarea&tname=subjareas&req=5&dept=' +
        dept + '&course=' + course + '&section=' + section;
    return new Promise(
        function(resolve, reject) {
            space(minRequestSpace);
            request(reqUrl, function (error, response, body) {
                log.logCount('section', verbose);
                if (!error && response.statusCode == 200) {
                    $ = cheerio.load(body);
                    const links = $('a');
                    let promises = [];
                    $(links).each(function (i, link) {
                        const url = link.attribs.href;
                        if (url && url.indexOf('roomID=') != -1) {
                            const table = link["parent"]['parent'];
                            let numTd = 0;
                            let roomSlot = {};
                            table['children'].forEach(function (td) {
                                if (td['name'] && td['name'] == 'td') {
                                    let content = td['children'][0]['data'];
                                    switch (numTd) {
                                        case 1:
                                            roomSlot['day'] = content.trim().replace(/[^0-9a-zA-Z\s]/g, '').split(' ');
                                            break;
                                        case 2:
                                            roomSlot['startTime'] = content.trim();
                                            break;
                                        case 3:
                                            roomSlot['endTime'] = content.trim();
                                            break;
                                        case 4:
                                            roomSlot['building'] = content.trim();
                                            break;
                                        default:
                                            break;
                                    }
                                    numTd++;
                                }
                            });
                            let buildingId = url.split('roomID')[0].split('').splice(url.indexOf("buildingID=") + 11).join('').slice(0,-1);
                            promises.push(addBuildingAddressToRoomSlot(url, verbose, minRequestSpace, buildingId, roomSlot));
                            roomSlot['roomID'] = url.split('').splice(url.indexOf("roomID=") + 7).join('');
                            roomSlot['sectionID'] = `${dept} ${course} ${section}`;
                            roomSlots.push(roomSlot);
                        }
                    });
                    Promise.all(promises).then(function() {
                        resolve(roomSlots);
                    });
                } else {
                    reject(error);
                }
            });
        }
    );
}

function addBuildingAddressToRoomSlot(detailPageURL, verbose, minRequestSpace, buildingId, roomSlot) {
    return new Promise(
        function(resolve, reject) {
            new Promise(function (resolve, reject) {
                if (!(buildingId in roomAddressDict)) {
                    space(minRequestSpace);
                    if (!(buildingId in roomAddressDict)) {
                        request(detailPageURL, function (error, response, body) {
                            log.logCount('building page', verbose);
                            if (!error && response.statusCode == 200) {
                                $ = cheerio.load(body);
                                const TDs = $('.displayBoxFieldAlignTop').next();
                                roomAddressDict[buildingId] = TDs[0].children[0].data;
                                resolve(`added ${ buildingId } to dict ${ JSON.stringify(roomAddressDict) }`);
                            } else {
                                reject(error);
                            }
                        });
                    } else {
                        resolve("already in dict");
                    }
                } else {
                    resolve("already in dict");
                }
            }).then(function() {
                roomSlot['address'] = roomAddressDict[buildingId];
                resolve("successfully added");
            }).catch(function(error) {
                reject(error);
            });
        }
    );
}

function getListOfSections(term, html) {
    let listOfChildren = [];
    $ = cheerio.load(html);
    const links = $('a');
    $(links).each(function(i, link) {
        const url = link.attribs.href;
        if (url && url.indexOf('section=') != -1){
            if (link.parent.next.next.next.next.children[0].data.indexOf(term) !== -1) {
                listOfChildren.push(url.split('').splice(url.indexOf('section=') + 8).join(''));
            }
        }
    });
    return listOfChildren;
}