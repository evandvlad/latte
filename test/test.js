/**
 * Autor: Evstigneev Andrey
 * Date: 03.11.2014
 * Time: 23:40
 */

var assert = require("assert"),
    Latte = require("../latte.js"),
    fspy = require("./fspy.js");

function noop(){}

describe('L & R', function(){
    
    it('create & check', function(){
        var l = Latte.L();

        assert.equal(Latte.isL(l), true); 
    });

    it('unpack L', function(){
        var l = Latte.L('left');

        assert.equal(l.value, 'left'); 
    });

    it('isL', function(){
        assert.equal(Latte.isL(undefined), false); 
        assert.equal(Latte.isL(null), false); 
        assert.equal(Latte.isL(''), false); 
        assert.equal(Latte.isL(Latte.L()), true); 
    });

    it('isR', function(){
        assert.equal(Latte.isR(undefined), true); 
        assert.equal(Latte.isR(null), true); 
        assert.equal(Latte.isR(''), true); 
        assert.equal(Latte.isR(Latte.L()), false); 
    });
});

describe('Streams', function(){
    
    it('create IStream', function(){
        var s = new Latte.IStream(noop);
        assert.equal(Latte.isIStream(s), true); 
        assert.equal(Latte.isMStream(s), false); 
        assert.equal(Latte.isStream(s), true); 
    }); 

    it('create IStream without new operator', function(){
        var s = Latte.IStream(noop);
        assert.equal(Latte.isIStream(s), true); 
        assert.equal(Latte.isStream(s), true); 
    }); 

    it('create MStream', function(){
        var s = new Latte.MStream(noop);
        assert.equal(Latte.isIStream(s), false); 
        assert.equal(Latte.isMStream(s), true); 
        assert.equal(Latte.isStream(s), true); 
    }); 

    it('create MStream without new operator', function(){
        var s = Latte.MStream(noop);
        assert.equal(Latte.isMStream(s), true); 
        assert.equal(Latte.isStream(s), true); 
    }); 

    it('isIStream', function(){
        assert.equal(Latte.isIStream(null), false); 
        assert.equal(Latte.isIStream({}), false); 
        assert.equal(Latte.isIStream(Latte.MStream(noop)), false); 
        assert.equal(Latte.isIStream(Latte.IStream(noop)), true); 
    });

    it('isMStream', function(){
        assert.equal(Latte.isMStream(null), false); 
        assert.equal(Latte.isMStream({}), false); 
        assert.equal(Latte.isMStream(Latte.IStream(noop)), false); 
        assert.equal(Latte.isMStream(Latte.MStream(noop)), true); 
    });

    it('isStream', function(){
        assert.equal(Latte.isStream(null), false); 
        assert.equal(Latte.isStream({}), false); 
        assert.equal(Latte.isStream(Latte.IStream(noop)), true); 
        assert.equal(Latte.isStream(Latte.MStream(noop)), true); 
    });
});

describe('callback', function(){
    
    it('define', function(){
        var cb = Latte.callback(noop);
        assert.equal(Latte.isCallback(cb), true); 
    });

    it('isCallback', function(){
        assert.equal(Latte.isCallback(function(){}), false); 
        assert.equal(Latte.isCallback({}), false); 
        assert.equal(Latte.isCallback(null), false); 
        assert.equal(Latte.isCallback(Latte.callback(noop)), true); 
    });
});

describe('extend', function(){
     
    it('methods', function(){
        var S = Latte.extend(Latte.IStream, {
            test : function(){
                return 'test';
            }
        }),
        s = S(noop);

        assert.equal(Latte.isStream(s), true); 
        assert.equal(Latte.isIStream(s), true); 
        assert.equal(s.test(), 'test'); 
    });

    it('rewrite constructor', function(){
        var S = Latte.extend(Latte.IStream, {
            constructor : function(){
                Latte.IStream.apply(this, arguments);
                this.value = 'test'; 
            },
            test : function(){
                return this.value;
            }
        }),
        s = new S(noop);

        assert.equal(Latte.isStream(s), true); 
        assert.equal(Latte.isIStream(s), true); 
        assert.equal(s.test(), 'test'); 
    });

    it('without second argument', function(){
        var S = Latte.extend(Latte.MStream),
        s = S(noop);

        assert.equal(Latte.isStream(s), true); 
        assert.equal(Latte.isMStream(s), true); 
        assert.equal(typeof s.log === 'function', true); 
    });

    it('check static methods', function(){
        var S = Latte.extend(Latte.MStream);
        assert.equal(typeof S.shell === 'function', true); 
    });
});
