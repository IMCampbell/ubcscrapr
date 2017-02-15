const scrapeRS = require("./roomSlotScrapr");

module.exports = function scrapeRoomSlots(term, minRequestSpace = 1000, verbose = false) {
        return scrapeRS(term, verbose, minRequestSpace);
};