/**
 * Autor: Evstigneev Andrey
 * Date: 25.08.2014
 * Time: 21:42
 */

var traceur = require('traceur');
var fs = require('fs');

var contents = fs.readFileSync('../latte.es6.js').toString();

var result = traceur.compile(contents, {
    filename : "latte.es6",
    experimental : true,
    blockBinding : true,
    moduleName : true,
    symbols : true,
    debug : true,
    annotations : true
});

if(result.error)
    throw result.error;

fs.writeFileSync('../latte.es6.cmpl.js', result.js);