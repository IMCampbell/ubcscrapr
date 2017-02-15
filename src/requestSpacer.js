let instance = {};

module.exports = function space(minRequestSpace) {
    function createInstance() {
        instance = {
            'lastRequestTime' : 0,
            'unlocked': true
        }
    }

    if (!instance.lastRequestTime) {
        createInstance()
    }

    while (!instance.unlocked) {}
    instance.unlocked = false;
    while (Date.now() < instance.lastRequestTime + minRequestSpace) {}
    instance.lastRequestTime = Date.now();
    instance.unlocked = true;
};