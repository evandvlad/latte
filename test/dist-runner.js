'use strict';

var tests = require('./spec'),
    
    Latte = require('../dist/latte'),
    LatteMin = require('../dist/latte.min');

tests.run(Latte);
tests.run(LatteMin);

