const cheerio = require('cheerio');

exports.getListOfChildren = function (nameOfChild, html) {
    let listOfChildren = [];
    $ = cheerio.load(html);
    const links = $('img');
    $(links).each(function(i, link) {
        const url = link.attribs.src;
        if (url && url.indexOf(nameOfChild + '=') != -1){
            listOfChildren.push(url.split('').splice(url.indexOf(nameOfChild + '=') + nameOfChild.length + 1).join(''));
        }
    });
    return listOfChildren;
}