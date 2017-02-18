const cheerio = require('cheerio');
const request = require("request");
const space = require("./requestSpacer");
const log = require("./logger");

module.exports = function scrapeRoomSlots(term, verbose, minRequestSpace, deptsToScrape) {
    let roomSlots = [];
    const reqUrl = 'http://courses.students.ubc.ca/cs/main?pname=subjarea&tname=subjareas&req=0';
    return new Promise(
        function(resolve, reject) {
            space(minRequestSpace);
            request(reqUrl, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    const depts = [];
                    $ = cheerio.load(body);
                    const links = $('a');
                    $(links).each(function(i, link) {
                        const url = link.attribs.href;
                        if (url && url.indexOf('dept=') != -1){
                            depts.push(url.split('').splice(url.indexOf("dept=") + 5).join(''))
                        }
                    });
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
                if (!error && response.statusCode == 200) {
                    const courses = [];
                    $ = cheerio.load(body);
                    const links = $('a');
                    $(links).each(function (i, link) {
                        const url = link.attribs.href;
                        if (url && url.indexOf('course=') != -1) {
                            courses.push(url.split('').splice(url.indexOf("course=") + 7).join(''))
                        }
                    });
                    const promises = [];
                    courses.forEach(function (course) {
                        promises.push(parseCourse(term, dept, course, verbose, minRequestSpace));
                    });
                    Promise.all(promises).then(function(returnSlotsArray) {
                        returnSlotsArray.forEach(function(returnSlots) {
                            roomSlots = roomSlots.concat(returnSlots);
                        });
                        log(dept, verbose);
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
                if (!error && response.statusCode == 200) {
                    const sections = [];
                    $ = cheerio.load(body);
                    const links = $('a');
                    $(links).each(function (i, link) {
                        const url = link.attribs.href;
                        if (url && url.indexOf('section=') != -1) {
                            sections.push(url.split('').splice(url.indexOf("section=") + 8).join(''))
                        }
                    });
                    const promises = [];
                    sections.forEach(function (section) {
                        promises.push(parseSection(term, dept, course, section, minRequestSpace));
                    });
                    Promise.all(promises).then(function(returnSlotsArray) {
                        returnSlotsArray.forEach(function(returnSlots) {
                            roomSlots = roomSlots.concat(returnSlots);
                        });
                        log(dept + " " + course, verbose);
                        resolve(roomSlots);
                    });
                } else {
                    reject(error);
                }
            });
        }
    );
}

function parseSection(term, dept, course, section, minRequestSpace) {
    const roomSlots = [];
    const reqUrl = 'https://courses.students.ubc.ca/cs/main?pname=subjarea&tname=subjareas&req=5&dept=' +
        dept + '&course=' + course + '&section=' + section;
    return new Promise(
        function(resolve, reject) {
            space(minRequestSpace);
            request(reqUrl, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    $ = cheerio.load(body);
                    const links = $('a');
                    $(links).each(function (i, link) {
                        const url = link.attribs.href;
                        if (url && url.indexOf('roomID=') != -1) {
                            let roomSlot = {};
                            const table = link["parent"]['parent'];
                            let numTd = 0;
                            let correctTerm = true;
                            table['children'].forEach(function (td) {
                                if (correctTerm && td['name'] && td['name'] == 'td') {
                                    let content = td['children'][0]['data'];
                                    switch (numTd) {
                                        case 0:
                                            if (content.indexOf(term) == -1) {
                                                correctTerm = false;
                                            }
                                            break;
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
                            if (correctTerm) {
                                roomSlot['roomID'] = url.split('').splice(url.indexOf("roomID=") + 7).join('');
                                roomSlots.push(roomSlot);
                            }
                        }
                    });
                    resolve(roomSlots);
                } else {
                    reject(error);
                }
            });
        }
    );
}
