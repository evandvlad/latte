/**
 * Autor: Evstigneev Andrey
 * Date: 03.11.2014
 * Time: 23:40
 */

var assert = require("assert"),
    Latte = require("../latte.js"),
    fspy = require("./fspy.js");

function noop(){}

function lift(v){
    return function(f){
        return f(v); 
    };
}

describe('L & R > ', function(){
    
    it('create & check', function(){
        var l = Latte.L();

        assert.equal(Latte.isL(l), true); 
    });

    it('unpack L', function(){
        var l = Latte.L('left');

        assert.equal(Latte.val(l), 'left'); 
    });

    it('unpack R', function(){
        assert.equal(Latte.val(null), null); 
        assert.equal(Latte.val('test'), 'test'); 
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

describe('Streams > ', function(){
    
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

describe('callback > ', function(){
    
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

describe('extend > ', function(){
     
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

describe('Stream instance methods > ', function(){
    
    describe('listen > ', function(){

        it('IStream R value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('IStream L value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error'))); 

            s.listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'error');
                done();
            }, 50);
        });

        it('IStream several values, ignore second handler call', function(done){
            var spy = fspy(),
                s = Latte.IStream(function(h){
                    h('test');
                    setTimeout(function(){
                        h(Latte.L('error')); 
                    }, 0);
                });

            s.listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                assert.equal(spy.count, 1);
                done();
            }, 50);
        });

        it('IStream some values, ignore return value', function(done){
            var spy = fspy(),
                s = Latte.IStream(function(h){
                    h('test');
                    return 'rest';
                });

            s.listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('MStream several values', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    h('test');
                    setTimeout(function(){
                        h('rest');
                    }, 0);
                });

            s.listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'rest');
                assert.equal(spy.count, 2);
                done();
            }, 50);
        });

        it('same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s === s.listen(noop), true);
        });
    });

    describe('listenL > ', function(){

        it('L value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error'))); 

            s.listenL(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'error');
                done();
            }, 50);
        });
        
        it('ignore R value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test')); 

            s.listenL(spy);
            
            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50);
        });

        it('several values', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    h('test'); 
                    setTimeout(function(){
                        h(Latte.L('error'));
                        h('rest');
                    }, 0);
                });

            s.listenL(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'error');
                assert.equal(spy.count, 1);
                done();
            }, 50);
        });

        it('same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s === s.listenL(noop), true);
        });

    }); 

    describe('listenR > ', function(){

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test')); 

            s.listenR(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });
        
        it('ignore L value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error'))); 

            s.listenR(spy);
            
            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50);
        });

        it('several values', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    h('test'); 
                    setTimeout(function(){
                        h(Latte.L('error'));
                        h('rest');
                    }, 0);
                });

            s.listenR(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'rest');
                assert.equal(spy.count, 2);
                done();
            }, 50);
        });

        it('same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s === s.listenR(noop), true);
        });
    }); 

    describe('then > ', function(){

        it('R value, return R value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.then(function(v){
                return v + '!';
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test!');
                assert.equal(spy3.args[0], 'test!');
                done();
            }, 50);
        });
        
        it('R value, return L value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.then(function(v){
                return Latte.L(v + '!');
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(spy1.args[0], 'test!');
                assert.equal(spy2.called, false);
                assert.equal(spy3.args[0], 'test!');
                done();
            }, 50);
        });

        it('L value, return R value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.then(function(v){
                return v + '!';
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'error!');
                assert.equal(spy3.args[0], 'error!');
                done();
            }, 50);
        });
        
        it('L value, return L value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.then(function(v){
                return Latte.L(v + '!');
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(spy1.args[0], 'error!');
                assert.equal(spy2.called, false);
                assert.equal(spy3.args[0], 'error!');
                done();
            }, 50);
        });

        it('stream L value', function(done){
            var spy = fspy(),
                s = Latte.MStream(lift('test'));

            s.then(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(Latte.L(v + '!'));
                    }, 0);
                });
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done();
            }, 50);
        });

        it('stream R value', function(done){
            var spy = fspy(),
                s = Latte.MStream(lift('test'));

            s.then(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(v + '!');
                    }, 0);
                });
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done();
            }, 50);
        });
        
        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.then(noop), true);
        }); 
    }); 

    describe('thenL > ', function(){

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.thenL(function(v){
                return v + '!';
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('L value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.thenL(function(v){
                return v + '!';
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error!');
                done();
            }, 50);
        });

        it('stream L value', function(done){
            var spy = fspy(),
                s = Latte.MStream(lift(Latte.L('error')));

            s.thenL(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(Latte.L(v + '!'));
                    }, 0);
                });
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error!');
                done();
            }, 50);
        });

        it('stream R value', function(done){
            var spy = fspy(),
                s = Latte.MStream(lift(Latte.L('error')));

            s.thenL(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(v + '!');
                    }, 0);
                });
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error!');
                done();
            }, 50);
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.thenL(noop), true);
        }); 
    });

    describe('thenR > ', function(){

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.thenR(function(v){
                return v + '!';
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done();
            }, 50);
        });

        it('L value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.thenR(function(v){
                return v + '!';
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error');
                done();
            }, 50);
        });

        it('stream L value', function(done){
            var spy = fspy(),
                s = Latte.MStream(lift('test'));

            s.thenR(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(Latte.L(v + '!'));
                    }, 0);
                });
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done();
            }, 50);
        });

        it('stream R value', function(done){
            var spy = fspy(),
                s = Latte.MStream(lift('test'));

            s.thenR(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(v + '!');
                    }, 0);
                });
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done();
            }, 50);
        });
        
        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.thenR(noop), true);
        }); 
    });

    describe('fmap > ', function(){

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.fmap(function(v){
                return v + '!';
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done();
            }, 50);
        });

        it('L value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fmap(function(v){
                return v + '!';
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error!');
                done();
            }, 50);
        });

        it('stream value', function(done){
            var spy = fspy(),
                s = Latte.MStream(lift('test'));

            s.fmap(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(v + '!');
                    }, 0);
                });
            }).listen(spy);

            setTimeout(function(){
                assert.equal(Latte.isStream(spy.args[0]), true);
                done();
            }, 50);
        });
        
        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.fmap(noop), true);
        }); 
    }); 

    describe('fmapL > ', function(){

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.fmapL(function(v){
                return v + '!';
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('L value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fmapL(function(v){
                return v + '!';
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error!');
                done();
            }, 50);
        });

        it('stream value', function(done){
            var spy = fspy(),
                s = Latte.MStream(lift(Latte.L('error')));

            s.fmapL(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(v + '!');
                    }, 0);
                });
            }).listen(spy);

            setTimeout(function(){
                assert.equal(Latte.isStream(spy.args[0]), true);
                done();
            }, 50);
        });
        
        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.fmapL(noop), true);
        }); 
    });

    describe('fmapR > ', function(){

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.fmapR(function(v){
                return v + '!';
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done();
            }, 50);
        });

        it('L value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fmapR(function(v){
                return v + '!';
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error');
                done();
            }, 50);
        });

        it('stream value', function(done){
            var spy = fspy(),
                s = Latte.MStream(lift('test'));

            s.fmapR(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(v + '!');
                    }, 0);
                });
            }).listen(spy);

            setTimeout(function(){
                assert.equal(Latte.isStream(spy.args[0]), true);
                done();
            }, 50);
        });
        
        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.fmapR(noop), true);
        }); 
    });

    describe('pass > ', function(){
        
        it('L value from source', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.pass('rest').listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'rest'); 
                done();
            }, 50); 
        });

        it('L value from pass', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.pass(Latte.L('rest')).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'rest'); 
                done();
            }, 50); 
        });

        it('R value from source & R value from pass', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.pass('rest').listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'rest'); 
                done();
            }, 50); 
        });

        it('R value from source & L value from pass', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.pass(Latte.L('rest')).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'rest'); 
                done();
            }, 50); 
        });

        it('stream value from pass', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.pass(Latte.IStream(lift('rest'))).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'rest'); 
                done();
            }, 50); 
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.pass(), true);
        }); 
    });

    describe('passL > ', function(){
        
        it('L value from source', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.passL('rest').listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'rest'); 
                done();
            }, 50); 
        });

        it('L value from pass', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.passL(Latte.L('rest')).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'rest'); 
                done();
            }, 50); 
        });

        it('R value from source & R value from pass', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.passL('rest').listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test'); 
                done();
            }, 50); 
        });

        it('R value from source & L value from pass', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.passL(Latte.L('rest')).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test'); 
                done();
            }, 50); 
        });

        it('stream value from pass', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.passL(Latte.IStream(lift('rest'))).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'rest'); 
                done();
            }, 50); 
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.passL(), true);
        }); 
    });

    describe('passR > ', function(){
        
        it('L value from source', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.passR('rest').listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test'); 
                done();
            }, 50); 
        });

        it('L value from pass', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.passR(Latte.L('rest')).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test'); 
                done();
            }, 50); 
        });

        it('R value from source & R value from pass', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.passR('rest').listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'rest'); 
                done();
            }, 50); 
        });

        it('R value from source & L value from pass', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.passR(Latte.L('rest')).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'rest'); 
                done();
            }, 50); 
        });

        it('stream value from pass', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.passR(Latte.IStream(lift('rest'))).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error'); 
                done();
            }, 50); 
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.passR(), true);
        }); 
    }); 

    describe('when > ', function(){
        
        it('L value & return true', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.when(function(v){
                return v === 'error'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error');
                done();
            }, 50); 
        });

        it('L value & return false', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.when(function(v){
                return v !== 'error'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50); 
        });

        it('R value & return true', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.when(function(v){
                return v === 'test'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50); 
        });

        it('R value & return false', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.when(function(v){
                return v !== 'test'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50); 
        });

        it('coercion result to Boolean', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.when(function(v){
                return v; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50); 
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.when(noop), true);
        }); 

    });

    describe('whenL > ', function(){
        
        it('L value & return true', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.whenL(function(v){
                return v === 'error'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error');
                done();
            }, 50); 
        });

        it('L value & return false', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.whenL(function(v){
                return v !== 'error'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50); 
        });

        it('R value & return true', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.whenL(function(v){
                return v === 'test'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50); 
        });

        it('R value & return false', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.whenL(function(v){
                return v !== 'test'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50); 
        });

        it('coercion result to Boolean', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.whenL(function(v){
                return v; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error');
                done();
            }, 50); 
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.whenL(noop), true);
        }); 

    });
    
    describe('whenR > ', function(){
        
        it('L value & return true', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.whenR(function(v){
                return v === 'error'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error');
                done();
            }, 50); 
        });

        it('L value & return false', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.whenR(function(v){
                return v !== 'error'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error');
                done();
            }, 50); 
        });

        it('R value & return true', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.whenR(function(v){
                return v === 'test'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50); 
        });

        it('R value & return false', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.whenR(function(v){
                return v !== 'test'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50); 
        });

        it('coercion result to Boolean', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.whenR(function(v){
                return v; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50); 
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.whenR(noop), true);
        }); 

    });

    describe('unless > ', function(){
        
        it('L value & return true', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.unless(function(v){
                return v === 'error'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50); 
        });

        it('L value & return false', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.unless(function(v){
                return v !== 'error'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error');
                done();
            }, 50); 
        });

        it('R value & return true', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.unless(function(v){
                return v === 'test'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50); 
        });

        it('R value & return false', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.unless(function(v){
                return v !== 'test'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50); 
        });

        it('coercion result to Boolean', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.unless(function(v){
                return v; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50); 
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.unless(noop), true);
        }); 

    });

    describe('unlessL > ', function(){
        
        it('L value & return true', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.unlessL(function(v){
                return v === 'error'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50); 
        });

        it('L value & return false', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.unlessL(function(v){
                return v !== 'error'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error');
                done();
            }, 50); 
        });

        it('R value & return true', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.unlessL(function(v){
                return v === 'test'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50); 
        });

        it('R value & return false', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.unlessL(function(v){
                return v !== 'test'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50); 
        });

        it('coercion result to Boolean', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.unlessL(function(v){
                return v; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50); 
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.unlessL(noop), true);
        }); 

    });
    
    describe('unlessR > ', function(){
        
        it('L value & return true', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.unlessR(function(v){
                return v === 'error'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error');
                done();
            }, 50); 
        });

        it('L value & return false', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.unlessR(function(v){
                return v !== 'error'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error');
                done();
            }, 50); 
        });

        it('R value & return true', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.unlessR(function(v){
                return v === 'test'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50); 
        });

        it('R value & return false', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.unlessR(function(v){
                return v !== 'test'; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50); 
        });

        it('coercion result to Boolean', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.unlessR(function(v){
                return v; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50); 
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.unlessR(noop), true);
        }); 

    });

    describe('dip > ', function(){
        
        it('lazy initialization', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                s = Latte.IStream(function(h){
                    setTimeout(function(){
                        h('test'); 
                    }, 0);
                });

            s.dip(function(h){
                spy2();
                return function(v){
                    h(v + '!'); 
                }; 
            }).listen(spy);
            
            assert.equal(spy2.called, false);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                assert.equal(spy2.called, true);
                done(); 
            }, 50); 
        }); 

        it('ignore return', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.dip(function(h){
                return function(v){
                    h(v + '!'); 
                    return 'rest'
                }; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done(); 
            }, 50); 
        }); 

        it('L value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.dip(function(h){
                return function(v){
                    h(v + '!'); 
                }; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error!');
                done(); 
            }, 50); 
        }); 

        it('force stream', function(done){
            var spy = fspy(),
                s = Latte.MStream(lift('test'));

            s.dip(function(h){
                return function(v){
                    setTimeout(function(){
                        h(v + '!');
                        h(v + '?');
                        h(v + '.'); 
                    }, 0);
                }; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test.');
                assert.equal(spy.count, 3);
                done(); 
            }, 50); 
        }); 

        it('break stream', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h('test'); 
                        h('rest'); 
                        h('west'); 
                    }, 0); 
                });

            s.dip(function(h){
                var count = 0;
                return function(v){
                    count += 1;
                    count == 2 && h(v + '!');
                }; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'rest!');
                assert.equal(spy.count, 1);
                done(); 
            }, 50); 
        }); 

        it('notify on init', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h('test'); 
                        h('rest'); 
                        h('west'); 
                    }, 0); 
                });

            s.dip(function(h){
                h('init');
                return noop; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'init');
                assert.equal(spy.count, 1);
                done(); 
            }, 50); 
        }); 

        it('do not unpack stream value', function(done){
            var spy = fspy(),
                s = Latte.MStream(lift(Latte.IStream(lift('test'))));

            s.dip(function(h){
                return h; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(Latte.isStream(spy.args[0]), true);
                done(); 
            }, 50); 
        }); 

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.dip(noop), true);
        }); 

    }); 

    describe('dipL > ', function(){
        
        it('L value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.dipL(function(h){
                return function(v){
                    h(v + '!'); 
                }; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error!');
                done(); 
            }, 50); 
        }); 

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.dipL(function(h){
                return function(v){
                    h(v + '!'); 
                }; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done(); 
            }, 50); 
        }); 

        it('force stream', function(done){
            var spy = fspy(),
                s = Latte.MStream(lift(Latte.L('error')));

            s.dipL(function(h){
                return function(v){
                    setTimeout(function(){
                        h(v + '!');
                        h(v + '?');
                        h(v + '.'); 
                    }, 0);
                }; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error.');
                assert.equal(spy.count, 3);
                done(); 
            }, 50); 
        }); 

        it('break stream', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h(Latte.L('test')); 
                        h(Latte.L('rest')); 
                        h(Latte.L('west')); 
                    }, 0); 
                });

            s.dipL(function(h){
                var count = 0;
                return function(v){
                    count += 1;
                    count == 2 && h(v + '!');
                }; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'rest!');
                assert.equal(spy.count, 1);
                done(); 
            }, 50); 
        }); 

        it('do not unpack stream value', function(done){
            var spy = fspy(),
                s = Latte.MStream(lift(Latte.IStream(lift(Latte.L('error')))));

            s.dipL(function(h){
                return h;
            }).listen(spy);

            setTimeout(function(){
                assert.equal(Latte.isStream(spy.args[0]), true);
                done(); 
            }, 50); 
        }); 

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.dipL(noop), true);
        }); 

    });  

    describe('dipR > ', function(){
        
        it('L value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.dipR(function(h){
                return function(v){
                    h(v + '!'); 
                }; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'error');
                done(); 
            }, 50); 
        }); 

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.dipR(function(h){
                return function(v){
                    h(v + '!'); 
                }; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done(); 
            }, 50); 
        }); 

        it('force stream', function(done){
            var spy = fspy(),
                s = Latte.MStream(lift('test'));

            s.dipR(function(h){
                return function(v){
                    setTimeout(function(){
                        h(v + '!');
                        h(v + '?');
                        h(v + '.'); 
                    }, 0);
                }; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test.');
                assert.equal(spy.count, 3);
                done(); 
            }, 50); 
        }); 

        it('break stream', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h('test'); 
                        h('rest'); 
                        h('west'); 
                    }, 0); 
                });

            s.dipR(function(h){
                var count = 0;
                return function(v){
                    count += 1;
                    count == 2 && h(v + '!');
                }; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'rest!');
                assert.equal(spy.count, 1);
                done(); 
            }, 50); 
        }); 

        it('do not unpack stream value', function(done){
            var spy = fspy(),
                s = Latte.MStream(lift(Latte.IStream(lift('test'))));

            s.dipR(function(h){
                return h;
            }).listen(spy);

            setTimeout(function(){
                assert.equal(Latte.isStream(spy.args[0]), true);
                done(); 
            }, 50); 
        }); 

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.dipR(noop), true);
        }); 

    });

    describe('debounce > ', function(){
        
        it('L value', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h(Latte.L('e-1')); 
                        h(Latte.L('e-2')); 
                        h(Latte.L('e-3')); 
                        h(Latte.L('e-4')); 
                    }, 0);
                });

            s.debounce(10).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'e-4');
                assert.equal(spy.count, 1);
                done(); 
            }, 50); 
        }); 

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h('v-1'); 
                        h('v-2'); 
                        h('v-3'); 
                        h('v-4'); 
                    }, 0);
                });

            s.debounce(10).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'v-4');
                assert.equal(spy.count, 1);
                done(); 
            }, 50); 
        }); 

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.debounce(10), true);
        }); 
    }); 

    describe('debounceL > ', function(){
        
        it('L value', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h(Latte.L('e-1')); 
                        h(Latte.L('e-2')); 
                        h(Latte.L('e-3')); 
                        h(Latte.L('e-4')); 
                    }, 0);
                });

            s.debounceL(10).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'e-4');
                assert.equal(spy.count, 1);
                done(); 
            }, 50); 
        }); 

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h('v-1'); 
                        h('v-2'); 
                        h('v-3'); 
                        h('v-4'); 
                    }, 0);
                });

            s.debounceL(10).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'v-4');
                assert.equal(spy.count, 4);
                done(); 
            }, 50); 
        }); 

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.debounceL(10), true);
        }); 
    }); 

    describe('debounceR > ', function(){
        
        it('L value', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h(Latte.L('e-1')); 
                        h(Latte.L('e-2')); 
                        h(Latte.L('e-3')); 
                        h(Latte.L('e-4')); 
                    }, 0);
                });

            s.debounceR(10).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'e-4');
                assert.equal(spy.count, 4);
                done(); 
            }, 50); 
        }); 

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h('v-1'); 
                        h('v-2'); 
                        h('v-3'); 
                        h('v-4'); 
                    }, 0);
                });

            s.debounceR(10).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'v-4');
                assert.equal(spy.count, 1);
                done(); 
            }, 50); 
        }); 

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.debounceR(10), true);
        }); 
    }); 

    describe('throttle > ', function(){
        
        it('L value', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h(Latte.L('e-1')); 
                        h(Latte.L('e-2')); 
                        h(Latte.L('e-3')); 
                        h(Latte.L('e-4')); 
                    }, 0);
                });

            s.throttle(10).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'e-4');
                assert.equal(spy.count, 1);
                done(); 
            }, 50); 
        }); 

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h('v-1'); 
                        h('v-2'); 
                        h('v-3'); 
                        h('v-4'); 
                    }, 0);
                });

            s.throttle(10).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'v-4');
                assert.equal(spy.count, 1);
                done(); 
            }, 50); 
        }); 

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.throttle(10), true);
        }); 
    }); 

    describe('throttleL > ', function(){
        
        it('L value', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h(Latte.L('e-1')); 
                        h(Latte.L('e-2')); 
                        h(Latte.L('e-3')); 
                        h(Latte.L('e-4')); 
                    }, 0);
                });

            s.throttleL(10).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'e-4');
                assert.equal(spy.count, 1);
                done(); 
            }, 50); 
        }); 

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h('v-1'); 
                        h('v-2'); 
                        h('v-3'); 
                        h('v-4'); 
                    }, 0);
                });

            s.throttleL(10).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'v-4');
                assert.equal(spy.count, 4);
                done(); 
            }, 50); 
        }); 

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.throttleL(10), true);
        }); 
    }); 

    describe('throttleR > ', function(){
        
        it('L value', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h(Latte.L('e-1')); 
                        h(Latte.L('e-2')); 
                        h(Latte.L('e-3')); 
                        h(Latte.L('e-4')); 
                    }, 0);
                });

            s.throttleR(10).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'e-4');
                assert.equal(spy.count, 4);
                done(); 
            }, 50); 
        }); 

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.MStream(function(h){
                    setTimeout(function(){
                        h('v-1'); 
                        h('v-2'); 
                        h('v-3'); 
                        h('v-4'); 
                    }, 0);
                });

            s.throttleR(10).listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'v-4');
                assert.equal(spy.count, 1);
                done(); 
            }, 50); 
        }); 

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.throttleR(10), true);
        }); 
    }); 
    
    // describe('any > ', function(){
        
    //     it('without argument, R value', function(done){
    //         var spy = fspy,
    //             s = Latte.IStream(lift('test'));
                
    //         s.any().listen(spy);
            
    //         setTimeout(function(){
    //             assert.equal(spy.args[0], 'test');
    //             done();
    //         }, 50);
    //     });
    // }); 
});
