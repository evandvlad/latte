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

    it('create IStream with context', function(done){
        var spy = fspy(),
            s = new Latte.IStream(function(h){
                h(this.val); 
            }, {val : 'test'});

        s.listen(spy);
        
        setTimeout(function(){
            assert.equal(spy.args[0], 'test'); 
            done();
        }, 50);
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

    it('create MStream with context', function(done){
        var spy = fspy(),
            s = new Latte.MStream(function(h){
                h(this.val); 
            }, {val : 'test'});

        s.listen(spy);
        
        setTimeout(function(){
            assert.equal(spy.args[0], 'test'); 
            done();
        }, 50);
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
    
    it('is function', function(){
        assert.equal(typeof Latte.callback(noop) === 'function', true);
    });
    
    it('return same value as original function', function(){
        var cb = Latte.callback(function(v){
            return v;
        });
        
        assert.equal(cb('test'), 'test');
    });
    
    it('take several arguments', function(){
        var cb = Latte.callback(function(a, b, c, d){
            return a + b + c + d;
        });
        
        assert.equal(cb('t', 'e', 's', 't'), 'test');
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

        it('R', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.listen(spy);
            
            setTimeout(function(){
                assert.equal(Latte.isL(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('L', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error'))); 

            s.listen(spy);
            
            setTimeout(function(){
                assert.equal(Latte.isL(spy.args[0]), true);
                assert.equal(Latte.val(spy.args[0]), 'error');
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

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.listen(function(v){
                spy(v + this.sign);
            }, {sign : '!'});
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done();
            }, 50);
        });

        it('same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s === s.listen(noop), true);
        });
    });

    describe('listenL > ', function(){

        it('L', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error'))); 

            s.listenL(spy);
            
            setTimeout(function(){
                assert.equal(Latte.isL(spy.args[0]), true);
                assert.equal(Latte.val(spy.args[0]), 'error');
                done();
            }, 50);
        });
        
        it('R', function(done){
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
                assert.equal(Latte.isL(spy.args[0]), true);
                assert.equal(Latte.val(spy.args[0]), 'error');
                assert.equal(spy.count, 1);
                done();
            }, 50);
        });

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.listenL(function(v){
                spy(Latte.val(v) + this.sign);
            }, {sign : '!'});
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'error!');
                done();
            }, 50);
        });

        it('same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s === s.listenL(noop), true);
        });

    }); 

    describe('listenR > ', function(){

        it('R', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test')); 

            s.listenR(spy);
            
            setTimeout(function(){
                assert.equal(Latte.isL(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });
        
        it('L', function(done){
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

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.listenR(function(v){
                spy(v + this.sign);
            }, {sign : '!'});
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done();
            }, 50);
        });

        it('same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s === s.listenR(noop), true);
        });
    }); 

    describe('then > ', function(){

        it('R -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.then(function(v){
                return v + '!';
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test!');
                assert.equal(spy3.args[0], 'test!');
                done();
            }, 50);
        });
        
        it('R -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.then(function(v){
                return Latte.L(v + '!');
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);
                
                assert.equal(Latte.val(spy1.args[0]), 'test!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'test!');
                done();
            }, 50);
        });

        it('L -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.then(function(v){
                return Latte.val(v) + '!';
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'error!');
                assert.equal(Latte.val(spy3.args[0]), 'error!');
                done();
            }, 50);
        });
        
        it('L -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.then(function(v){
                return Latte.L(Latte.val(v) + '!');
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);
                
                assert.equal(Latte.val(spy1.args[0]), 'error!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error!');
                done();
            }, 50);
        });

        it('R -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift('test'));

            s.then(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(v + '!');
                    }, 0);
                });
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test!');
                assert.equal(spy3.args[0], 'test!');
                done();
            }, 50);
        });
        
        it('R -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift('test'));

            s.then(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(Latte.L(v + '!'));
                    }, 0);
                });
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);
                
                assert.equal(Latte.val(spy1.args[0]), 'test!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'test!');
                done();
            }, 50);
        });

        it('L -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift(Latte.L('error')));

            s.then(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(Latte.val(v) + '!');
                    }, 0);
                });
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'error!');
                assert.equal(spy3.args[0], 'error!');
                done();
            }, 50);
        });
        
        it('L -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift(Latte.L('error')));

            s.then(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(Latte.L(Latte.val(v) + '!'));
                    }, 0);
                });
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);
                
                assert.equal(Latte.val(spy1.args[0]), 'error!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error!');
                done();
            }, 50);
        });

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.then(function(v){
                return v + this.sign;
            }, {sign : '!'}).listen(spy);
            
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

        it('R -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.thenL(function(v){
                return v + '!';
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test');
                assert.equal(spy3.args[0], 'test');
                done();
            }, 50);
        });
        
        it('R -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.thenL(function(v){
                return Latte.L(v + '!');
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);  

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test');
                assert.equal(spy3.args[0], 'test');
                done();
            }, 50);
        });


        it('L -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.thenL(function(v){
                return Latte.val(v) + '!';
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);  

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'error!');
                assert.equal(spy3.args[0], 'error!');
                done();
            }, 50);
        });
        
        it('L -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.thenL(function(v){
                return Latte.L(Latte.val(v) + '!');
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);      

                assert.equal(Latte.val(spy1.args[0]), 'error!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error!');
                done();
            }, 50);
        });

        it('L -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift(Latte.L('error')));

            s.thenL(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(Latte.L(Latte.val(v) + '!'));
                    }, 0);
                });
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);       

                assert.equal(Latte.val(spy1.args[0]), 'error!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error!');
                done();
            }, 50);
        });
        
        it('L -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift(Latte.L('error')));

            s.thenL(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(Latte.val(v) + '!');
                    }, 0);
                });
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);       

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'error!');
                assert.equal(spy3.args[0], 'error!');
                done();
            }, 50);
        });
        
        it('R -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift('test'));

            s.thenL(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(Latte.L(v + '!'));
                    }, 0);
                });
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);       

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test');
                assert.equal(spy3.args[0], 'test');
                done();
            }, 50);
        });
        
        it('R -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift('test'));

            s.thenL(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(v + '!');
                    }, 0);
                });
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);       

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test');
                assert.equal(spy3.args[0], 'test');
                done();
            }, 50);
        });

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.thenL(function(v){
                return Latte.val(v) + this.sign;
            }, {sign : '!'}).listen(spy);
            
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

        it('R -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.thenR(function(v){
                return v + '!';
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test!');
                assert.equal(spy3.args[0], 'test!');
                done();
            }, 50);
        });
        
        it('R -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.thenR(function(v){
                return Latte.L(v + '!');
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'test!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'test!');
                done();
            }, 50);
        });


        it('L -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.thenR(function(v){
                return v + '!';
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50);
        });
        
        it('L -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.thenR(function(v){
                return Latte.L(Latte.val(v) + '!');
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);  

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50);
        });

        it('L -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift(Latte.L('error')));

            s.thenR(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(Latte.L(v + '!'));
                    }, 0);
                });
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);  

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50);
        });
        
        it('L -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift(Latte.L('error')));

            s.thenR(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(v + '!');
                    }, 0);
                });
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50);
        });
        
        it('R -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift('test'));

            s.thenR(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(Latte.L(v + '!'));
                    }, 0);
                });
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'test!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'test!');
                done();
            }, 50);
        });
        
        it('R -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift('test'));

            s.thenR(function(v){
                return Latte.IStream(function(h){
                    setTimeout(function(){
                        h(v + '!');
                    }, 0);
                });
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test!');
                assert.equal(spy3.args[0], 'test!');
                done();
            }, 50);
        });

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.thenR(function(v){
                return v + this.sign;
            }, {sign : '!'}).listen(spy);
            
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

        it('R -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fmap(function(v){
                return v + '!';
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test!');
                assert.equal(spy3.args[0], 'test!');
                done();
            }, 50);
        });
        
        it('R -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fmap(function(v){
                return Latte.L(v + '!');
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'test!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'test!');
                done();
            }, 50);
        });

        it('L -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fmap(function(v){
                return Latte.val(v) + '!';
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'error!');
                assert.equal(spy3.args[0], 'error!');
                done();
            }, 50);
        });
        
        it('L -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fmap(function(v){
                return Latte.L(Latte.val(v) + '!');
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'error!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error!');
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

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.fmap(function(v){
                return v + this.sign;
            }, {sign : '!'}).listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done();
            }, 50);
        });
        
        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.fmap(noop), true);
        }); 
    }); 

    describe('fmapL > ', function(){

        it('R -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fmapL(function(v){
                return v + '!';
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test');
                assert.equal(spy3.args[0], 'test');
                done();
            }, 50);
        });
        
        it('R -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fmapL(function(v){
                return Latte.L(v + '!');
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test');
                assert.equal(spy3.args[0], 'test');
                done();
            }, 50);
        });

        it('L -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fmapL(function(v){
                return Latte.val(v) + '!';
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'error!');
                assert.equal(spy3.args[0], 'error!');
                done();
            }, 50);
        });
        
        it('L -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fmapL(function(v){
                return Latte.L(Latte.val(v) + '!');
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'error!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error!');
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

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fmapL(function(v){
                return Latte.val(v) + this.sign;
            }, {sign : '!'}).listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'error!');
                done();
            }, 50);
        });
        
        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.fmapL(noop), true);
        }); 
    });

    describe('fmapR > ', function(){

        it('R -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fmapR(function(v){
                return v + '!';
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test!');
                assert.equal(spy3.args[0], 'test!');
                done();
            }, 50);
        });
        
        it('R -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fmapR(function(v){
                return Latte.L(v + '!');
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'test!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'test!');
                done();
            }, 50);
        });

        it('L -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fmapR(function(v){
                return Latte.val(v) + '!';
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50);
        });
        
        it('L -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fmapR(function(v){
                return Latte.L(Latte.val(v) + '!');
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
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

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.fmapR(function(v){
                return v + this.sign;
            }, {sign : '!'}).listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done();
            }, 50);
        });
        
        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.fmapR(noop), true);
        }); 
    });

    describe('pass > ', function(){
        
        it('L -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.pass('rest').listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'rest');
                assert.equal(spy3.args[0], 'rest');
                done();
            }, 50); 
        });
        
        it('L -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.pass(Latte.L('rest')).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'rest');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'rest');
                done();
            }, 50); 
        });
        
        it('L -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.pass(Latte.IStream(lift(Latte.L('rest')))).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'rest');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'rest');
                done();
            }, 50); 
        });
        
        it('L -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.pass(Latte.IStream(lift('rest'))).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'rest');
                assert.equal(spy3.args[0], 'rest');
                done();
            }, 50); 
        });

        it('R -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.pass('rest').listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'rest');
                assert.equal(spy3.args[0], 'rest');
                done();
            }, 50); 
        });
        
        it('R -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.pass(Latte.L('rest')).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'rest');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'rest');
                done();
            }, 50); 
        });
        
        it('R -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.pass(Latte.IStream(lift(Latte.L('rest')))).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'rest');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'rest');
                done();
            }, 50); 
        });
        
        it('R -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.pass(Latte.IStream(lift('rest'))).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'rest');
                assert.equal(spy3.args[0], 'rest');
                done();
            }, 50); 
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.pass(), true);
        }); 
    });

    describe('passL > ', function(){
        
        it('L -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.passL('rest').listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'rest');
                assert.equal(spy3.args[0], 'rest');
                done();
            }, 50); 
        });
        
        it('L -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.passL(Latte.L('rest')).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'rest');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'rest');
                done();
            }, 50); 
        });
        
        it('L -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.passL(Latte.IStream(lift(Latte.L('rest')))).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'rest');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'rest');
                done();
            }, 50); 
        });
        
        it('L -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.passL(Latte.IStream(lift('rest'))).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'rest');
                assert.equal(spy3.args[0], 'rest');
                done();
            }, 50); 
        });

        it('R -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.passL('rest').listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test');
                assert.equal(spy3.args[0], 'test');
                done();
            }, 50); 
        });
        
        it('R -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.passL(Latte.L('rest')).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test');
                assert.equal(spy3.args[0], 'test');
                done();
            }, 50); 
        });
        
        it('R -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.passL(Latte.IStream(lift(Latte.L('rest')))).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test');
                assert.equal(spy3.args[0], 'test');
                done();
            }, 50); 
        });
        
        it('R -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.passL(Latte.IStream(lift('rest'))).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test');
                assert.equal(spy3.args[0], 'test');
                done();
            }, 50); 
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.passL(), true);
        }); 
    });

    describe('passR > ', function(){
        
        it('L -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.passR('rest').listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'test');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'test');
                done();
            }, 50); 
        });
        
        it('L -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.passR(Latte.L('rest')).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'test');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'test');
                done();
            }, 50); 
        });
        
        it('L -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.passR(Latte.IStream(lift(Latte.L('rest')))).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'test');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'test');
                done();
            }, 50); 
        });
        
        it('L -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('test')));

            s.passR(Latte.IStream(lift('rest'))).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'test');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'test');
                done();
            }, 50); 
        });

        it('R -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.passR('rest').listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'rest');
                assert.equal(spy3.args[0], 'rest');
                done();
            }, 50); 
        });
        
        it('R -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.passR(Latte.L('rest')).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'rest');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'rest');
                done();
            }, 50); 
        });
        
        it('R -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.passR(Latte.IStream(lift(Latte.L('rest')))).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'rest');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'rest');
                done();
            }, 50); 
        });
        
        it('R -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.passR(Latte.IStream(lift('rest'))).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'rest');
                assert.equal(spy3.args[0], 'rest');
                done();
            }, 50); 
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.passR(), true);
        }); 
    }); 

    describe('when > ', function(){
        
        it('L -> true', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.when(function(v){
                return Latte.val(v) === 'error'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50); 
        });

        it('L -> false', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.when(function(v){
                return Latte.val(v) !== 'error'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.called, false);
                assert.equal(spy3.called, false);
                done();
            }, 50); 
        });

        it('R -> true', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.when(function(v){
                return v === 'test'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test');
                assert.equal(Latte.val(spy3.args[0]), 'test');
                done();
            }, 50); 
        });

        it('R -> false', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.when(function(v){
                return v !== 'test'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.called, false);
                assert.equal(spy3.called, false);
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

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.when(function(v){
                return v === this.val;
            }, {val : 'test'}).listen(spy);
            
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

        it('L -> true', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.whenL(function(v){
                return Latte.val(v) === 'error'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50); 
        });

        it('L -> false', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.whenL(function(v){
                return Latte.val(v) !== 'error'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.called, false);
                assert.equal(spy3.called, false);
                done();
            }, 50); 
        });

        it('R -> true', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.whenL(function(v){
                return v === 'test'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test');
                assert.equal(Latte.val(spy3.args[0]), 'test');
                done();
            }, 50); 
        });

        it('R -> false', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.whenL(function(v){
                return v !== 'test'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test');
                assert.equal(Latte.val(spy3.args[0]), 'test');
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
                assert.equal(Latte.val(spy.args[0]), 'error');
                done();
            }, 50); 
        });

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.whenL(function(v){
                return Latte.val(v) === this.val;
            }, {val : 'error'}).listen(spy);
            
            setTimeout(function(){
                assert.equal(Latte.val(spy.args[0]), 'error');
                done();
            }, 50);
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.whenL(noop), true);
        }); 

    });
    
    describe('whenR > ', function(){
        
        it('L -> true', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.whenR(function(v){
                return Latte.val(v) === 'error'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50); 
        });

        it('L -> false', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.whenR(function(v){
                return v !== 'error'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50); 
        });

        it('R -> true', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.whenR(function(v){
                return v === 'test'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test');
                assert.equal(Latte.val(spy3.args[0]), 'test');
                done();
            }, 50); 
        });

        it('R -> false', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.whenR(function(v){
                return v !== 'test'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy3.called, false);
                assert.equal(spy3.called, false);
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

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.whenR(function(v){
                return v === this.val;
            }, {val : 'test'}).listen(spy);
            
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
        
        it('L -> false', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.unless(function(v){
                return Latte.val(v) !== 'error'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50); 
        });

        it('L -> true', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.unless(function(v){
                return Latte.val(v) === 'error'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.called, false);
                assert.equal(spy3.called, false);
                done();
            }, 50); 
        });

        it('R -> false', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.unless(function(v){
                return v !== 'test'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test');
                assert.equal(Latte.val(spy3.args[0]), 'test');
                done();
            }, 50); 
        });

        it('R -> true', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.unless(function(v){
                return v === 'test'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.called, false);
                assert.equal(spy3.called, false);
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

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.unless(function(v){
                return v !== this.val;
            }, {val : 'test'}).listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.unless(noop), true);
        }); 

    });

    describe('unlessL > ', function(){
        
        it('L -> false', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.unlessL(function(v){
                return Latte.val(v) !== 'error'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50); 
        });

        it('L -> true', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.unlessL(function(v){
                return Latte.val(v) === 'error'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.called, false);
                assert.equal(spy3.called, false);
                done();
            }, 50); 
        });

        it('R -> false', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.unlessL(function(v){
                return v !== 'test'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test');
                assert.equal(Latte.val(spy3.args[0]), 'test');
                done();
            }, 50); 
        });

        it('R -> true', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.unlessL(function(v){
                return v === 'test'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test');
                assert.equal(Latte.val(spy3.args[0]), 'test');
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

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.unlessL(function(v){
                return Latte.val(v) !== this.val;
            }, {val : 'error'}).listen(spy);
            
            setTimeout(function(){
                assert.equal(Latte.val(spy.args[0]), 'error');
                done();
            }, 50);
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.unlessL(noop), true);
        }); 

    });
    
    describe('unlessR > ', function(){
        
        it('L -> false', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.unlessR(function(v){
                return Latte.val(v) !== 'error'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50); 
        });

        it('L -> true', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.unlessR(function(v){
                return v === 'error'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true); 

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50); 
        });

        it('R -> false', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.unlessR(function(v){
                return v !== 'test'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false); 

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test');
                assert.equal(Latte.val(spy3.args[0]), 'test');
                done();
            }, 50); 
        });

        it('R -> true', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.unlessR(function(v){
                return v === 'test'; 
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy3.called, false);
                assert.equal(spy3.called, false);
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

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.unlessR(function(v){
                return v !== this.val;
            }, {val : 'test'}).listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.unlessR(noop), true);
        }); 

    });

    describe('cdip > ', function(){
        
        it('lazy initialization', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                s = Latte.IStream(function(h){
                    setTimeout(function(){
                        h('test'); 
                    }, 0);
                });

            s.cdip(function(h){
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

            s.cdip(function(h){
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

            s.cdip(function(h){
                return function(v){
                    h(Latte.val(v) + '!'); 
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

            s.cdip(function(h){
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

            s.cdip(function(h){
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

            s.cdip(function(h){
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

            s.cdip(function(h){
                return h; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(Latte.isStream(spy.args[0]), true);
                done(); 
            }, 50); 
        }); 

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.cdip(function(h){
                var self = this;
                return function(v){
                    h(v + self.sign); 
                };
            }, {sign : '!'}).listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done();
            }, 50);
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.cdip(noop), true);
        }); 

    }); 

    describe('cdipL > ', function(){
        
        it('L value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.cdipL(function(h){
                return function(v){
                    h(Latte.val(v) + '!'); 
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

            s.cdipL(function(h){
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

            s.cdipL(function(h){
                return function(v){
                    setTimeout(function(){
                        h(Latte.val(v) + '!');
                        h(Latte.val(v) + '?');
                        h(Latte.val(v) + '.'); 
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

            s.cdipL(function(h){
                var count = 0;
                return function(v){
                    count += 1;
                    count == 2 && h(Latte.val(v) + '!');
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

            s.cdipL(function(h){
                return h;
            }).listen(spy);

            setTimeout(function(){
                assert.equal(Latte.isStream(spy.args[0]), true);
                done(); 
            }, 50); 
        }); 

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.cdipL(function(h){
                var self = this;
                return function(v){
                    h(Latte.val(v) + self.sign); 
                };
            }, {sign : '!'}).listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'error!');
                done();
            }, 50);
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.cdipL(noop), true);
        }); 

    });  

    describe('cdipR > ', function(){
        
        it('L value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.cdipR(function(h){
                return function(v){
                    h(v + '!'); 
                }; 
            }).listen(spy);

            setTimeout(function(){
                assert.equal(Latte.val(spy.args[0]), 'error');
                done(); 
            }, 50); 
        }); 

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.cdipR(function(h){
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

            s.cdipR(function(h){
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

            s.cdipR(function(h){
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

            s.cdipR(function(h){
                return h;
            }).listen(spy);

            setTimeout(function(){
                assert.equal(Latte.isStream(spy.args[0]), true);
                done(); 
            }, 50); 
        }); 

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.cdipR(function(h){
                var self = this;
                return function(v){
                    h(v + self.sign); 
                };
            }, {sign : '!'}).listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done();
            }, 50);
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.cdipR(noop), true);
        }); 

    });

    describe('fdip > ', function(){
        
        it('lazy initialization', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                s = Latte.IStream(function(h){
                    setTimeout(function(){
                        h('test'); 
                    }, 0);
                });

            s.fdip(function(h){
                spy2();
                return function(v){
                    return v + '!'; 
                }; 
            }).listen(spy);
            
            assert.equal(spy2.called, false);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                assert.equal(spy2.called, true);
                done(); 
            }, 50); 
        }); 

        it('L -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fdip(function(){
                return function(v){
                    return Latte.L(Latte.val(v) + '!'); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);

                assert.equal(Latte.val(spy1.args[0]), 'error!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error!');
                done(); 
            }, 50);     
        });

        it('L -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fdip(function(){
                return function(v){
                    return Latte.val(v) + '!'; 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'error!');
                assert.equal(Latte.val(spy3.args[0]), 'error!');
                done(); 
            }, 50);     
        });

        it('R -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fdip(function(){
                return function(v){
                    return Latte.L(Latte.val(v) + '!'); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);

                assert.equal(Latte.val(spy1.args[0]), 'test!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'test!');
                done(); 
            }, 50);     
        });

        it('R -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fdip(function(){
                return function(v){
                    return Latte.val(v) + '!'; 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test!');
                assert.equal(Latte.val(spy3.args[0]), 'test!');
                done(); 
            }, 50);     
        });

        it('L -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fdip(function(){
                return function(v){
                    return Latte.IStream(lift(Latte.L(Latte.val(v) + '!'))); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);

                assert.equal(Latte.val(spy1.args[0]), 'error!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error!');
                done(); 
            }, 50);     
        });

        it('L -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fdip(function(){
                return function(v){
                    return Latte.IStream(lift(Latte.val(v) + '!')); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'error!');
                assert.equal(Latte.val(spy3.args[0]), 'error!');
                done(); 
            }, 50);     
        });

        it('R -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fdip(function(){
                return function(v){
                    return Latte.IStream(lift(Latte.L(Latte.val(v) + '!'))); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);

                assert.equal(Latte.val(spy1.args[0]), 'test!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'test!');
                done(); 
            }, 50);     
        });

        it('R -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fdip(function(){
                return function(v){
                    return Latte.IStream(lift(Latte.val(v) + '!')); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test!');
                assert.equal(Latte.val(spy3.args[0]), 'test!');
                done(); 
            }, 50);     
        });

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.fdip(function(h){
                var self = this;
                return function(v){
                    return v + self.sign; 
                };
            }, {sign : '!'}).listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done();
            }, 50);
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.fdip(noop), true);
        }); 

    }); 

    describe('fdipL > ', function(){
        
        it('lazy initialization', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                s = Latte.IStream(function(h){
                    setTimeout(function(){
                        h('test'); 
                    }, 0);
                });

            s.fdipL(function(h){
                spy2();
                return function(v){
                    return v + '!'; 
                }; 
            }).listen(spy);
            
            assert.equal(spy2.called, false);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                assert.equal(spy2.called, false);
                done(); 
            }, 50); 
        }); 

        it('L -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fdipL(function(){
                return function(v){
                    return Latte.L(Latte.val(v) + '!'); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);

                assert.equal(Latte.val(spy1.args[0]), 'error!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error!');
                done(); 
            }, 50);     
        });

        it('L -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fdipL(function(){
                return function(v){
                    return Latte.val(v) + '!'; 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'error!');
                assert.equal(Latte.val(spy3.args[0]), 'error!');
                done(); 
            }, 50);     
        });

        it('R -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fdipL(function(){
                return function(v){
                    return Latte.L(Latte.val(v) + '!'); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test');
                assert.equal(Latte.val(spy3.args[0]), 'test');
                done(); 
            }, 50);     
        });

        it('R -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fdipL(function(){
                return function(v){
                    return Latte.val(v) + '!'; 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test');
                assert.equal(Latte.val(spy3.args[0]), 'test');
                done(); 
            }, 50);     
        });

        it('L -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fdipL(function(){
                return function(v){
                    return Latte.IStream(lift(Latte.L(Latte.val(v) + '!'))); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);

                assert.equal(Latte.val(spy1.args[0]), 'error!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error!');
                done(); 
            }, 50);     
        });

        it('L -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fdipL(function(){
                return function(v){
                    return Latte.IStream(lift(Latte.val(v) + '!')); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'error!');
                assert.equal(Latte.val(spy3.args[0]), 'error!');
                done(); 
            }, 50);     
        });

        it('R -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fdipL(function(){
                return function(v){
                    return Latte.IStream(lift(Latte.L(Latte.val(v) + '!'))); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test');
                assert.equal(Latte.val(spy3.args[0]), 'test');
                done(); 
            }, 50);     
        });

        it('R -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fdipL(function(){
                return function(v){
                    return Latte.IStream(lift(Latte.val(v) + '!')); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test');
                assert.equal(Latte.val(spy3.args[0]), 'test');
                done(); 
            }, 50);     
        });

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fdipL(function(h){
                var self = this;
                return function(v){
                    return Latte.val(v) + self.sign; 
                };
            }, {sign : '!'}).listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'error!');
                done();
            }, 50);
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.fdipL(noop), true);
        }); 

    });   

    describe('fdipR > ', function(){
        
        it('lazy initialization', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                s = Latte.IStream(function(h){
                    setTimeout(function(){
                        h('test'); 
                    }, 0);
                });

            s.fdipR(function(h){
                spy2();
                return function(v){
                    return v + '!'; 
                }; 
            }).listen(spy);
            
            assert.equal(spy2.called, false);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                assert.equal(spy2.called, true);
                done(); 
            }, 50); 
        }); 

        it('L -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fdipR(function(){
                return function(v){
                    return Latte.L(Latte.val(v) + '!'); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done(); 
            }, 50);     
        });

        it('L -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fdipR(function(){
                return function(v){
                    return Latte.val(v) + '!'; 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done(); 
            }, 50);     
        });

        it('R -> L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fdipR(function(){
                return function(v){
                    return Latte.L(Latte.val(v) + '!'); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);

                assert.equal(Latte.val(spy1.args[0]), 'test!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'test!');
                done(); 
            }, 50);     
        });

        it('R -> R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fdipR(function(){
                return function(v){
                    return Latte.val(v) + '!'; 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test!');
                assert.equal(Latte.val(spy3.args[0]), 'test!');
                done(); 
            }, 50);     
        });

        it('L -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fdipR(function(){
                return function(v){
                    return Latte.IStream(lift(Latte.L(Latte.val(v) + '!'))); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done(); 
            }, 50);     
        });

        it('L -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));

            s.fdipR(function(){
                return function(v){
                    return Latte.IStream(lift(Latte.val(v) + '!')); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);

                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done(); 
            }, 50);     
        });

        it('R -> Stream L', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fdipR(function(){
                return function(v){
                    return Latte.IStream(lift(Latte.L(Latte.val(v) + '!'))); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy1.args[0]), true);
                assert.equal(Latte.isL(spy3.args[0]), true);

                assert.equal(Latte.val(spy1.args[0]), 'test!');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'test!');
                done(); 
            }, 50);     
        });

        it('R -> Stream R', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));

            s.fdipR(function(){
                return function(v){
                    return Latte.IStream(lift(Latte.val(v) + '!')); 
                };
            }).listenL(spy1).listenR(spy2).listen(spy3);

            setTimeout(function(){
                assert.equal(Latte.isL(spy2.args[0]), false);
                assert.equal(Latte.isL(spy3.args[0]), false);

                assert.equal(spy1.called, false);
                assert.equal(Latte.val(spy2.args[0]), 'test!');
                assert.equal(Latte.val(spy3.args[0]), 'test!');
                done(); 
            }, 50);     
        });

        it('with context', function(done){
            var spy = fspy(),
                s = Latte.IStream(lift('test'));

            s.fdip(function(h){
                var self = this;
                return function(v){
                    return v + self.sign; 
                };
            }, {sign : '!'}).listen(spy);
            
            setTimeout(function(){
                assert.equal(spy.args[0], 'test!');
                done();
            }, 50);
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.fdipR(noop), true);
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
                assert.equal(Latte.val(spy.args[0]), 'e-4');
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
                assert.equal(Latte.val(spy.args[0]), 'e-4');
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
                assert.equal(Latte.val(spy.args[0]), 'e-4');
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
                assert.equal(Latte.val(spy.args[0]), 'e-4');
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
                assert.equal(Latte.val(spy.args[0]), 'e-4');
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
                assert.equal(Latte.val(spy.args[0]), 'e-4');
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

    describe('log > ', function(){
        
        it('call with R value', function(){
            Latte.IStream(lift('R value for log')).log(); 
        }); 

        it('call with L value', function(){
            Latte.IStream(lift(Latte.L('L value for log'))).log(); 
        }); 
    }); 

    describe('logL > ', function(){
        
        it('call with R value', function(){
            Latte.IStream(lift('R value for logL')).logL(); 
        }); 

        it('call with L value', function(){
            Latte.IStream(lift(Latte.L('L value for logL'))).logL(); 
        }); 
    }); 

    describe('logR > ', function(){
        
        it('call with R value', function(){
            Latte.IStream(lift('R value for logR')).logR(); 
        }); 

        it('call with L value', function(){
            Latte.IStream(lift(Latte.L('L value for logR'))).logR(); 
        }); 
    }); 
    
    describe('any > ', function(){
        
        it('without argument, R value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));
                
            s.any().listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test');
                assert.equal(spy3.args[0], 'test');
                done();
            }, 50);
        });

        it('without argument, L value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));
                
            s.any().listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50);
        });

        it('+1 Stream, R value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift('test'));
                
            s.any(Latte.IStream(function(h){
                setTimeout(function(){
                    h('rest'); 
                }, 10); 
            })).listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(spy3.count, 2);
                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'rest');
                assert.equal(spy3.args[0], 'rest');
                done();
            }, 50);
        });

        it('+1 Stream, L value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift('test'));
                
            s.any(Latte.IStream(function(h){
                setTimeout(function(){
                    h(Latte.L('error')); 
                }, 10); 
            })).listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(spy3.count, 2);
                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.args[0], 'test');
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50);
        });

        it('+1, R value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(function(h){
                     setTimeout(function(){
                         h('test');  
                     }, 0);   
                });
                
            s.any('rest').listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(spy3.count, 2);
                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'test');
                assert.equal(spy3.args[0], 'test');
                done();
            }, 50);
        });

        it('+1, L value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(function(h){
                     setTimeout(function(){
                         h('test');  
                     }, 0);   
                });
                
            s.any(Latte.L('error')).listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(spy3.count, 2);
                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.args[0], 'test');
                assert.equal(spy3.args[0], 'test');
                done();
            }, 50);
        });

        it('list, R value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(function(h){
                     setTimeout(function(){
                         h('test');  
                     }, 0);   
                });
                
            s.any(['rest', Latte.IStream(function(h){
                setTimeout(function(){
                     h('west');  
                 }, 10); 
            })]).listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(spy3.count, 3);
                assert.equal(spy1.called, false);
                assert.equal(spy2.args[0], 'west');
                assert.equal(spy3.args[0], 'west');
                done();
            }, 50);
        });

        it('list, L value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(function(h){
                     setTimeout(function(){
                         h('test');  
                     }, 0);   
                });
                
            s.any(['rest', Latte.IStream(function(h){
                setTimeout(function(){
                     h(Latte.L('error'));  
                 }, 10); 
            })]).listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(spy3.count, 3);
                assert.equal(Latte.val(spy1.args[0]), 'error');
                assert.equal(spy2.args[0], 'test');
                assert.equal(Latte.val(spy3.args[0]), 'error');
                done();
            }, 50);
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.any(), true);
        }); 
    }); 

    describe('merge > ', function(){
        
        it('without argument, R value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift('test'));
                
            s.merge().listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(JSON.stringify(spy2.args[0]), '["test"]');
                assert.equal(JSON.stringify(spy3.args[0]), '["test"]');
                done();
            }, 50);
        });

        it('without argument, L value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.IStream(lift(Latte.L('error')));
                
            s.merge().listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(Latte.val(Latte.val(spy1.args[0])[0]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(Latte.val(spy3.args[0])[0]), 'error');

                assert.equal(Latte.val(spy1.args[0]).length, 1);
                assert.equal(Latte.val(spy3.args[0]).length, 1);
                done();
            }, 50);
        });

        it('+1 Stream, R value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift('test'));
                
            s.merge(Latte.IStream(function(h){
                setTimeout(function(){
                    h('rest'); 
                }, 10); 
            })).listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(JSON.stringify(spy2.args[0]), '["test","rest"]');
                assert.equal(JSON.stringify(spy3.args[0]), '["test","rest"]');
                done();
            }, 50);
        });

        it('+1 Stream, L value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(lift('test'));
                
            s.merge(Latte.IStream(function(h){
                setTimeout(function(){
                    h(Latte.L('error')); 
                }, 10); 
            })).listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(Latte.val(spy1.args[0])[0], 'test');
                assert.equal(Latte.val(Latte.val(spy1.args[0])[1]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0])[0], 'test');
                assert.equal(Latte.val(Latte.val(spy3.args[0])[1]), 'error');
                done();
            }, 50);
        });

        it('+1, R value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(function(h){
                     setTimeout(function(){
                         h('test');  
                     }, 0);   
                });
                
            s.merge('rest').listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(JSON.stringify(spy2.args[0]), '["test","rest"]');
                assert.equal(JSON.stringify(spy3.args[0]), '["test","rest"]');
                done();
            }, 50);
        });

        it('+1, L value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(function(h){
                     setTimeout(function(){
                         h('test');  
                     }, 0);   
                });
                
            s.merge(Latte.L('error')).listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(Latte.val(spy1.args[0])[0], 'test');
                assert.equal(Latte.val(Latte.val(spy1.args[0])[1]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0])[0], 'test');
                assert.equal(Latte.val(Latte.val(spy3.args[0])[1]), 'error');
                done();
            }, 50);
        });

        it('list, R value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(function(h){
                     setTimeout(function(){
                         h('test');  
                     }, 0);   
                });
                
            s.merge(['rest', Latte.IStream(function(h){
                setTimeout(function(){
                     h('west');  
                 }, 10); 
            })]).listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(JSON.stringify(spy2.args[0]), '["test","rest","west"]');
                assert.equal(JSON.stringify(spy3.args[0]), '["test","rest","west"]');
                done();
            }, 50);
        });

        it('list, L value', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                s = Latte.MStream(function(h){
                     setTimeout(function(){
                         h('test');  
                     }, 0);   
                });
                
            s.merge(['rest', Latte.IStream(function(h){
                setTimeout(function(){
                     h(Latte.L('error'));  
                 }, 10); 
            })]).listenL(spy1).listenR(spy2).listen(spy3);
            
            setTimeout(function(){
                assert.equal(Latte.val(spy1.args[0])[0], 'test');
                assert.equal(Latte.val(spy1.args[0])[1], 'rest');
                assert.equal(Latte.val(Latte.val(spy1.args[0])[2]), 'error');
                assert.equal(spy2.called, false);
                assert.equal(Latte.val(spy3.args[0])[0], 'test');
                assert.equal(Latte.val(spy3.args[0])[1], 'rest');
                assert.equal(Latte.val(Latte.val(spy3.args[0])[2]), 'error');
                done();
            }, 50);
        });

        it('not same instance', function(){
            var s = Latte.MStream(noop);
            assert.equal(s !== s.merge(), true);
        }); 
    }); 
});

describe('Stream static methods > ', function(){
    
    describe('any > ', function(){
    
        it('empty list', function(done){
            var spy = fspy(),
                s = Latte.IStream.any([]);

            s.listen(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done(); 
            }, 50); 
        });

        it('Stream R value', function(done){
            var spy = fspy(),
                s = Latte.IStream.any([Latte.IStream(lift('test'))]);

            s.listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done(); 
            }, 50); 
        });

        it('Stream L value', function(done){
            var spy = fspy(),
                s = Latte.IStream.any([Latte.IStream(lift(Latte.L('error')))]);

            s.listen(spy);

            setTimeout(function(){
                assert.equal(Latte.isL(spy.args[0]), true);
                assert.equal(Latte.val(spy.args[0]), 'error');
                done(); 
            }, 50); 
        });

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.IStream.any(['test']);

            s.listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done(); 
            }, 50); 
        });

        it('L value', function(done){
            var spy = fspy(),
                s = Latte.IStream.any([Latte.L('error')]);

            s.listen(spy);

            setTimeout(function(){
                assert.equal(Latte.isL(spy.args[0]), true);
                assert.equal(Latte.val(spy.args[0]), 'error');
                done(); 
            }, 50); 
        });

        it('all R values', function(done){
            var spy = fspy(),
                s = Latte.MStream.any(['test', Latte.IStream(function(h){
                    setTimeout(function(){
                        h('rest'); 
                    }, 0);
                })]);

            s.listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'rest');
                done(); 
            }, 50); 
        });

        it('has L value', function(done){
            var spy = fspy(),
                s = Latte.MStream.any(['test', Latte.IStream(function(h){
                    setTimeout(function(){
                        h(Latte.L('error')); 
                    }, 0);
                })]);

            s.listen(spy);

            setTimeout(function(){
                assert.equal(Latte.isL(spy.args[0]), true);
                assert.equal(Latte.val(spy.args[0]), 'error');
                done(); 
            }, 50); 
        });
    });

    describe('merge > ', function(){
        
        it('empty list', function(done){
            var spy = fspy(),
                s = Latte.IStream.merge([]);

            s.listen(spy);

            setTimeout(function(){
                assert.equal(JSON.stringify(spy.args[0]), '[]');
                done(); 
            }, 50); 
        });

        it('Stream R value', function(done){
            var spy = fspy(),
                s = Latte.IStream.merge([Latte.IStream(lift('test'))]);

            s.listen(spy);

            setTimeout(function(){
                assert.equal(JSON.stringify(spy.args[0]), '["test"]');
                done(); 
            }, 50); 
        });

        it('Stream L value', function(done){
            var spy = fspy(),
                s = Latte.IStream.merge([Latte.IStream(lift(Latte.L('error')))]);

            s.listen(spy);

            setTimeout(function(){
                assert.equal(Latte.isL(spy.args[0]), true);
                assert.equal(Latte.val(Latte.val(spy.args[0])[0]), 'error');
                done(); 
            }, 50); 
        });

        it('R value', function(done){
            var spy = fspy(),
                s = Latte.IStream.merge(['test']);

            s.listen(spy);

            setTimeout(function(){
                assert.equal(JSON.stringify(spy.args[0]), '["test"]');
                done(); 
            }, 50); 
        });

        it('L value', function(done){
            var spy = fspy(),
                s = Latte.IStream.merge([Latte.L('error')]);

            s.listen(spy);

            setTimeout(function(){
                assert.equal(Latte.isL(spy.args[0]), true);
                assert.equal(Latte.val(Latte.val(spy.args[0])[0]), 'error');
                done(); 
            }, 50); 
        });

        it('all R values', function(done){
            var spy = fspy(),
                s = Latte.MStream.merge(['test', Latte.IStream(function(h){
                    setTimeout(function(){
                        h('rest'); 
                    }, 0);
                })]);

            s.listen(spy);

            setTimeout(function(){
                assert.equal(JSON.stringify(spy.args[0]), '["test","rest"]');
                done(); 
            }, 50); 
        });

        it('has L value', function(done){
            var spy = fspy(),
                s = Latte.MStream.merge(['test', Latte.IStream(function(h){
                    setTimeout(function(){
                        h(Latte.L('error')); 
                    }, 0);
                })]);

            s.listen(spy);

            setTimeout(function(){
                assert.equal(Latte.isL(spy.args[0]), true);
                assert.equal(Latte.val(spy.args[0])[0], 'test');
                assert.equal(Latte.val(Latte.val(spy.args[0])[1]), 'error');
                done(); 
            }, 50); 
        });
    });  

    describe('shell', function(){
        
        it('IStream insterface', function(){
            var sh = Latte.IStream.shell();

            assert.equal(typeof sh.set === 'function', true); 
            assert.equal(Latte.isIStream(sh.out()), true);
            assert.equal(sh.out() === sh.out(), true); 
        }); 

        it('MStream insterface', function(){
            var sh = Latte.MStream.shell();

            assert.equal(typeof sh.set === 'function', true); 
            assert.equal(Latte.isMStream(sh.out()), true);
            assert.equal(sh.out() === sh.out(), true); 
        }); 

        it('set value before listener', function(done){
            var spy = fspy(),
                sh = Latte.IStream.shell();

            sh.set('test');
            sh.out().listen(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done(); 
            }, 50); 
        });

        it('set value after listener', function(done){
            var spy = fspy(),
                sh = Latte.IStream.shell();

            sh.out().listen(spy);
            sh.set('test');

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done(); 
            }, 50); 
        });

        it('R', function(done){
            var spy = fspy(),
                sh = Latte.IStream.shell();

            sh.out().listen(spy);
            sh.set('test');

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done(); 
            }, 50); 
        });

        it('L', function(done){
            var spy = fspy(),
                sh = Latte.IStream.shell();

            sh.out().listen(spy);
            sh.set(Latte.L('error'));

            setTimeout(function(){
                assert.equal(Latte.isL(spy.args[0]), true);
                assert.equal(Latte.val(spy.args[0]), 'error');
                done(); 
            }, 50); 
        });

        it('Stream R', function(done){
            var spy = fspy(),
                sh = Latte.IStream.shell();

            sh.out().listen(spy);
            sh.set(Latte.IStream(lift('test')));

            setTimeout(function(){
                assert.equal(Latte.isStream(spy.args[0]), true);
                done(); 
            }, 50); 
        });

        it('Stream L', function(done){
            var spy = fspy(),
                sh = Latte.IStream.shell();

            sh.out().listen(spy);
            sh.set(Latte.IStream(lift(Latte.L('error'))));

            setTimeout(function(){
                assert.equal(Latte.isStream(spy.args[0]), true);
                done(); 
            }, 50); 
        });
    }); 
});

describe('fun', function(){
       
    it('R', function(done){
        var spy = fspy(),
            s = Latte.fun(function(v){
                return v;
            })('test');
            
        s.listen(spy);
        
        setTimeout(function(){
            assert.equal(spy.args[0], 'test');
            done();
        }, 50);
    });
    
    it('L', function(done){
        var spy = fspy(),
            s = Latte.fun(function(v){
                return v;
            })(Latte.L('error'));
            
        s.listen(spy);
        
        setTimeout(function(){
            assert.equal(Latte.isL(spy.args[0]), true);
            assert.equal(Latte.val(spy.args[0]), 'error');
            done();
        }, 50);
    });
    
    it('several arguments', function(done){
        var spy = fspy(),
            s = Latte.fun(function(v1, v2, v3){
                return [Latte.val(v1), Latte.val(v2), Latte.val(v3)].join(',');
            })('test', Latte.L('error'), 'rest');
            
        s.listen(spy);
        
        setTimeout(function(){
            assert.equal(spy.args[0], 'test,error,rest');
            done();
        }, 50);
    });
    
    it('Stream R', function(done){
        var spy = fspy(),
            s = Latte.fun(function(v){
                return v;
            })(Latte.pack('test'));
            
        s.listen(spy);
        
        setTimeout(function(){
            assert.equal(Latte.isStream(spy.args[0]), true);
            done();
        }, 50);
    });
    
    it('with context', function(done){
        var spy = fspy(),
            s = Latte.fun(function(v){
                return v + this.sign;
            }, {sign : '!'})('test');
            
        s.listen(spy);
        
        setTimeout(function(){
            assert.equal(spy.args[0], 'test!');
            done();
        }, 50);
    });
    
    it('with callback', function(done){
        var spy = fspy(),
            s = Latte.fun(setTimeout)(Latte.callback(function(){
                return 'test';
            }, 0));
            
        s.listen(spy);
        
        setTimeout(function(){
            assert.equal(spy.args[0], 'test');
            done();
        }, 50);
    });
    
    it('return MStream', function(){
        var s = Latte.fun(function(){})();
        assert.equal(Latte.isMStream(s), true);
    });
});

describe('gen', function(){
    
    it('R', function(done){
        var spy = fspy(),
            s = Latte.gen(function*(v){
                return v;
            })('test');
            
        s.listen(spy);
        
        setTimeout(function(){
            assert.equal(spy.args[0], 'test');
            done();
        }, 50);
    });
    
    it('L', function(done){
        var spy = fspy(),
            s = Latte.gen(function*(v){
                return v;
            })(Latte.L('error'));
            
        s.listen(spy);
        
        setTimeout(function(){
            assert.equal(Latte.isL(spy.args[0]), true);
            assert.equal(Latte.val(spy.args[0]), 'error');
            done();
        }, 50);
    });
    
    it('several arguments', function(done){
        var spy = fspy(),
            s = Latte.gen(function*(v1, v2, v3){
                return [Latte.val(v1), Latte.val(v2), Latte.val(v3)].join(',');
            })('test', Latte.L('error'), 'rest');
            
        s.listen(spy);
        
        setTimeout(function(){
            assert.equal(spy.args[0], 'test,error,rest');
            done();
        }, 50);
    });
    
    it('yields', function(done){
        var spy = fspy(),
            s = Latte.gen(function*(v){
                var x = yield Latte.IStream(function(h){
                        setTimeout(function(){
                            h('rest');
                        }, 0);
                    }),
                    y = 'west';
                
                return [v, x, y].join(',');
            })('test');
            
        s.listen(spy);
        
        setTimeout(function(){
            assert.equal(spy.args[0], 'test,rest,west');
            done();
        }, 50);
    });
    
    it('return Stream', function(done){
        var spy = fspy(),
            s = Latte.gen(function*(v){
                var x = yield Latte.IStream(function(h){
                        setTimeout(function(){
                            h('rest');
                        }, 0);
                    }),
                    y = 'west';
                
                return Latte.pack([v, x, y].join(','));
            })('test');
            
        s.listen(spy);
        
        setTimeout(function(){
            assert.equal(spy.args[0], 'test,rest,west');
            done();
        }, 50);
    });
    
    it('brake if L', function(done){
        var spy = fspy(),
            s = Latte.gen(function*(v){
                var x = yield Latte.IStream(function(h){
                        setTimeout(function(){
                            h(Latte.L('error'));
                        }, 0);
                    }),
                    y = 'west';
                
                return Latte.pack([v, x, y].join(','));
            })('test');
            
        s.listen(spy);
        
        setTimeout(function(){
            assert.equal(Latte.isL(spy.args[0]), true);
            assert.equal(Latte.val(spy.args[0]), 'error');
            done();
        }, 50);
    });
    
    
    it('with context', function(done){
        var spy = fspy(),
            s = Latte.gen(function*(v){
                return v + this.sign;
            }, {sign : "!"})('test');
            
        s.listen(spy);
        
        setTimeout(function(){
            assert.equal(spy.args[0], 'test!');
            done();
        }, 50);
    });
    
    it('return IStream', function(){
        var s = Latte.gen(function*(){})();
        assert.equal(Latte.isIStream(s), true);
    });
});

describe('pack', function(){
    
    it('types', function(){
        var s = Latte.pack('test');
        
        assert.equal(Latte.isStream(s), true);
        assert.equal(Latte.isIStream(s), true);
    });
         
    it('R', function(done){
        var spy = fspy(),
            s = Latte.pack('test');

        s.listen(spy);

        setTimeout(function(){
            assert.equal(Latte.isL(spy.args[0]), false);
            assert.equal(spy.args[0], 'test');
            done(); 
        }); 
    });

    it('L', function(done){
        var spy = fspy(),
            s = Latte.pack(Latte.L('error'));

        s.listen(spy);

        setTimeout(function(){
            assert.equal(Latte.isL(spy.args[0]), true);
            assert.equal(Latte.val(spy.args[0]), 'error');
            done(); 
        }); 
    });

    it('Stream R', function(done){
        var spy = fspy(),
            s = Latte.pack(Latte.pack('test'));

        s.listen(spy);

        setTimeout(function(){
            assert.equal(Latte.isStream(spy.args[0]), true);
            done(); 
        }); 
    });

    it('Stream L', function(done){
        var spy = fspy(),
            s = Latte.pack(Latte.pack(Latte.L('error')));

        s.listen(spy);

        setTimeout(function(){
            assert.equal(Latte.isStream(spy.args[0]), true);
            done(); 
        }); 
    });
}); 
