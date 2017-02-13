const main = require("./ubcscrapr");

module.exports = function(term) {
    return main(term);
};

main(1).then(function(returnSlots) {
    console.log(returnSlots);
});