/**
 * Autor: Evstigneev Andrey
 * Date: 01.10.2014
 * Time: 21:40
 */

var assert = require("assert"),
    Latte = require("../latte.js"),
    fspy = require("./fspy.js");

describe('E', function(){

    it('isE', function(){   
         assert.equal(Latte.isE(Latte.E()), true);                      
         assert.equal(Latte.isE(null), false);
         assert.equal(Latte.isE(undefined), false);
         assert.equal(Latte.isE(), false);
    });

    it('E value', function(){
        assert.equal(Latte.E().value, undefined);
        assert.equal(Latte.E('E').value, 'E');
        assert.equal(Latte.E(undefined).value, undefined);
    });
});

describe('callback', function(){

    it('isFunction', function(){
        assert.equal(typeof Latte.callback(function(){}) === 'function', true);
    });

    it('isCallback', function(){
        assert.equal(Latte.isCallback(function(){}), false);
        assert.equal(Latte.isCallback(Latte.callback(function(){})), true);
    });

    it('return', function(){
        assert.equal(Latte.callback(function(){})(), undefined);
        assert.equal(Latte.callback(function(){return 'test';})(), 'test');
    });

    it('call with several arguments', function(){
        var spy = fspy();

        Latte.callback(spy)(1,2,3);

        assert.equal(spy.args.length, 3);
        assert.equal(spy.args[0], 1);
        assert.equal(spy.args[1], 2);
        assert.equal(spy.args[2], 3);
    });

    it('do not unpack value from Latte instance', function(){
        var spy = fspy();
        Latte.callback(spy)(Latte.Promise(function(){}));
        assert.equal(Latte.isPromise(spy.args[0]), true);
    });
});

describe('Promise instance', function(){

    describe('common', function(){

        it('isPromise', function(){
            var p = Latte.Promise(function(){});

            assert.equal(Latte.isPromise(p), true);
        });

        it('isStream', function(){
            var p = Latte.Promise(function(){});

            assert.equal(Latte.isStream(p), false);
        });

        it('isLatte', function(){
            var p = Latte.Promise(function(){});

            assert.equal(Latte.isLatte(p), true);
        });

        it('not call', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(){
                    return 'test';
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50);
        });

        it('call with & without new operator', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p1 = new Latte.Promise(function(h){
                    h('test');
                }),
                p2 = Latte.Promise(function(h){
                    h('test');
                });

            p1.always(spy1);
            p2.always(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), false);
                assert.equal(Latte.isE(spy2.args[0]), false);
                assert.equal(spy1.args[0], 'test');
                assert.equal(spy2.args[0], 'test');
                done();
            }, 50);
        });

        it('call handler without value', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h();
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], undefined);
                done();
            }, 50);
        });

        it('process only first value', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                    h('rest');
                    h('west');
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(spy.count, 1);
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('call executor with context', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(this.value);
                }, {value : 'test'});

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('ignore return value in executor', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                    return this;
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('second arguments as prev value', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                    return this;
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('promise as value', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.Promise(function(h2){
                        h2('test');
                    }));
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('stream as value', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.Stream(function(h2){
                        h2('test');
                    }));
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });
    });

    describe('always', function(){

        it('for success value', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('for error value', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 50);
        });

        it('call handler with context', function(done){
            var ctx = {value : null},
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.always(function(v){
                this.value = v;
            }, ctx);

            setTimeout(function(){
                assert.equal(Latte.isE(ctx.value), false);
                assert.equal(ctx.value, 'test');
                done();
            }, 50);
        });

        it('from one promise', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.always(spy1);
            p.always(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), true);
                assert.equal(Latte.isE(spy2.args[0]), true);
                assert.equal(spy1.args[0].value, 'error');
                assert.equal(spy2.args[0].value, 'error');
                done();
            }, 50);
        });

        it('in chain', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.always(spy1).always(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), false);
                assert.equal(Latte.isE(spy2.args[0]), false);
                assert.equal(spy1.args[0], 'test');
                assert.equal(spy2.args[0], 'test');
                done();
            }, 50);
        });

        it('ignore return value in handler', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.always(function(v){
                return 'west';
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('catch distant E', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.fmap(function(){
                return Latte.E('error');
            }).fmap(function(v){
                return v;
            }).fmap(function(v){
                return Latte.Promise(function(h){
                    h(v);
                });
            }).pass('test').always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 50);
        });

        it('same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.always(function(){});

            assert.equal(p1 === p2, true);
        });
    });

    describe('next', function(){

        it('call', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.next(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('not call if E', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.next(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50);
        });

        it('call handler with context', function(done){
            var ctx = {value : null},
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.next(function(v){
                this.value = v;
            }, ctx);

            setTimeout(function(){
                assert.equal(Latte.isE(ctx.value), false);
                assert.equal(ctx.value, 'test');
                done();
            }, 50);
        });

        it('from one promise', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.next(spy1);
            p.next(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), false);
                assert.equal(Latte.isE(spy2.args[0]), false);
                assert.equal(spy1.args[0], 'test');
                assert.equal(spy2.args[0], 'test');
                done();
            }, 50);
        });

        it('in chain', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.next(spy1).next(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), false);
                assert.equal(Latte.isE(spy2.args[0]), false);
                assert.equal(spy1.args[0], 'test');
                assert.equal(spy2.args[0], 'test');
                done();
            }, 50);
        });

        it('ignore return value in handler', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.next(function(){
                return 'west';
            }).next(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.next(function(){});

            assert.equal(p1 === p2, true);
        });
    });

    describe('fail', function(){

        it('call', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.fail(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 50);
        });

        it('not call if not E', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('error');
                });

            p.fail(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50);
        });

        it('call handler with context', function(done){
            var ctx = {value : null},
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.fail(function(v){
                this.value = v.value;
            }, ctx);

            setTimeout(function(){
                assert.equal(ctx.value, 'error');
                done();
            }, 50);
        });

        it('from one promise', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.fail(spy1);
            p.fail(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), true);
                assert.equal(Latte.isE(spy2.args[0]), true);
                assert.equal(spy1.args[0].value, 'error');
                assert.equal(spy2.args[0].value, 'error');
                done();
            }, 50);
        });

        it('in chain', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.fail(spy1).fail(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), true);
                assert.equal(Latte.isE(spy2.args[0]), true);
                assert.equal(spy1.args[0].value, 'error');
                assert.equal(spy2.args[0].value, 'error');
                done();
            }, 50);
        });

        it('ignore return value in handler', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.fail(function(e){
                return Latte.E('new error');
            }).fail(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 50);
        });

        it('catch distant E', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.fmap(function(){
                return Latte.E('error');
            }).fmap(function(v){
                return v;
            }).fmap(function(v){
                return Latte.Promise(function(h){
                    h(v);
                });
            }).pass('test').always(spy1).fail(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), true);
                assert.equal(Latte.isE(spy2.args[0]), true);
                assert.equal(spy1.args[0].value, 'error');
                assert.equal(spy2.args[0].value, 'error');
                done();
            }, 50);
        });

        it('same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.fail(function(){});

            assert.equal(p1 === p2, true);
        });
    });

    describe('when', function(){

        it('if true result', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(5);
                });

            p.when(function(x){
                return x > 0;
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 5);
                done();
            }, 50);
        });

        it('if false result', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(-5);
                });

            p.when(function(x){
                return x > 0;
            }).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50);
        });

        it('coercion to boolean', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(0);
                });

            p.when(function(x){
                return x;
            }).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50);
        });

        it('not call if E, but do not break chain', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.when(spy1).always(spy2);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.called, true);
                assert.equal(Latte.isE(spy2.args[0]), true);
                assert.equal(spy2.args[0].value, 'error');
                done();
            }, 50);
        });

        it('call handler with context', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.when(function(v){
                return v === this.value;
            }, {value : 'test'}).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('from one promise', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h(5);
                });

            p.when(function(x){
                return x > 0;
            }).always(spy1);

            p.when(function(x){
                return x <= 0;
            }).always(spy2);

            setTimeout(function(){
                assert.equal(spy1.called, true);
                assert.equal(spy2.called, false);
                done();
            }, 50);
        });

        it('in chain', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h(5);
                });

            p.when(function(x){
                return x > 0;
            }).when(function(x){
                return x === 4;
            }).always(spy1);

            p.when(function(x){
                return x > 0;
            }).when(function(x){
                return x === 5;
            }).always(spy2);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.called, true);
                done();
            }, 50);
        });

        it('not same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.when(function(){});

            assert.equal(p1 === p2, false);
        });
    });

    describe('unless', function(){

        it('if true result', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(5);
                });

            p.unless(function(x){
                return x < 0;
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 5);
                done();
            }, 50);
        });

        it('if false result', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(-5);
                });

            p.unless(function(x){
                return x < 0;
            }).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50);
        });

        it('coercion to boolean', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(5);
                });

            p.unless(function(x){
                return x;
            }).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50);
        });

        it('not call if E, but do not break chain', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.unless(spy1).always(spy2);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.called, true);
                assert.equal(Latte.isE(spy2.args[0]), true);
                assert.equal(spy2.args[0].value, 'error');
                done();
            }, 50);
        });

        it('call handler with context', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.unless(function(v){
                return v === this.value;
            }, {value : 'west'}).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('from one promise', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h(5);
                });

            p.unless(function(x){
                return x < 0;
            }).always(spy1);

            p.unless(function(x){
                return x >= 0;
            }).always(spy2);

            setTimeout(function(){
                assert.equal(spy1.called, true);
                assert.equal(spy2.called, false);
                done();
            }, 50);
        });

        it('in chain', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h(5);
                });

            p.unless(function(x){
                return x < 0;
            }).unless(function(x){
                return x === 5;
            }).always(spy1);

            p.unless(function(x){
                return x < 0;
            }).unless(function(x){
                return x === 4;
            }).always(spy2);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.called, true);
                done();
            }, 50);
        });

        it('not same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.unless(function(){});

            assert.equal(p1 === p2, false);
        });
    });

    describe('fmap', function(){
        describe('return not Latte', function(){
            it('call', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h('test');
                    });

                p.fmap(function(v){
                    return '(' + v + ')';
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '(test)');
                    done();
                }, 50);
            });

            it('return E', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h('test');
                    });

                p.fmap(function(v){
                    return Latte.E('error');
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'error');
                    done();
                }, 50);
            });

            it('not call if E, but do not brake chain', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.fmap(spy1).always(spy2);

                setTimeout(function(){
                    assert.equal(spy1.called, false);
                    assert.equal(Latte.isE(spy2.args[0]), true);
                    assert.equal(spy2.args[0].value, 'error');
                    done();
                }, 50);
            });

            it('call handler with context', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h('test');
                    });

                p.fmap(function(v){
                    return this.prefix + v + this.suffix;
                }, {prefix: '(', suffix: ')'}).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '(test)');
                    done();
                }, 50);
            });

            it('from one promise', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Promise(function(h){
                        h(5);
                    });

                p.fmap(function(x){
                    return x * 2;
                }).always(spy1);

                p.fmap(function(x){
                    return x * 5;
                }).always(spy2);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy1.args[0]), false);
                    assert.equal(Latte.isE(spy2.args[0]), false);
                    assert.equal(spy1.args[0], 10);
                    assert.equal(spy2.args[0], 25);
                    done();
                }, 50);
            });

            it('in chain', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h(5);
                    });

                p.fmap(function(x){
                    return x * 2;
                }).fmap(function(x){
                    return x * 5;
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], 50);
                    done();
                }, 50);
            });

            it('not same instance', function(){
                var p1 = Latte.Promise(function(){
                    }),
                    p2 = p1.fmap(function(){
                    });

                assert.equal(p1 === p2, false);
            });
        });

        describe('return Latte', function(){

            it('call', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h('test');
                    });

                p.fmap(function(v){
                    return Latte.Promise(function(h){
                        h('(' + v + ')');
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '(test)');
                    done();
                }, 50);
                
            });

            it('return E', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h('test');
                    });

                p.fmap(function(v){
                    return Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'error');
                    done();
                }, 50);
            });

            it('not call if E, but do not break chain', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.fmap(function(v){
                    return Latte.Promise(function(h){
                        h('(' + v + ')');
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'error');
                    done();
                }, 50);
            });

            it('call handler with context', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h('test');
                    });

                p.fmap(function(v){
                    return Latte.Promise(function(h){
                        h(this.prefix + v + this.suffix);
                    }, this);
                }, {prefix : '(', suffix : ')'}).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '(test)');
                    done();
                }, 50);
            });

            it('from one promise', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Promise(function(h){
                        h('test');
                    });

                p.fmap(function(v){
                    return Latte.Promise(function(h){
                        h('(' + v + ')');
                    })
                }).always(spy1);

                p.fmap(function(v){
                    return Latte.Promise(function(h){
                        h('[' + v + ']');
                    })
                }).always(spy2);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy1.args[0]), false);
                    assert.equal(Latte.isE(spy2.args[0]), false);
                    assert.equal(spy1.args[0], '(test)');
                    assert.equal(spy2.args[0], '[test]');
                    done();
                }, 50);
            });

            it('in chain', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h('test');
                    });

                p.fmap(function(v){
                    return Latte.Promise(function(h){
                        h('[' + v + ']');
                    });
                }).fmap(function(v){
                    return Latte.Promise(function(h){
                        h('(' + v + ')');
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '([test])');
                    done();
                }, 50);
            });

            it('nested', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h('test');
                    });

                p.fmap(function(v){
                    return Latte.Promise(function(h){
                        h('[' + v + ']');
                    }).fmap(function(v){
                        return Latte.Promise(function(h){
                            h('(' + v + ')');
                        });
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '([test])');
                    done();
                }, 50);
            });

            it('not same instance', function(){
                var p1 = Latte.Promise(function(){}),
                    p2 = p1.fmap(function(){
                        return p1;
                    });

                assert.equal(p1 === p2, false);
            });
        });
    });

    describe('pass', function(){

        it('call with success value', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.pass('west').always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'west');
                done();
            }, 50);
        });

        it('call with error value', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.pass(Latte.E('error')).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 50);
        });

        it('call without value', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.pass().always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], undefined);
                done();
            }, 50);
        });

        it('not call if E, but do not break chain', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.pass(Latte.E('new error')).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 50);
        });

        it('from one promise', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h(5);
                });

            p.pass('test').always(spy1);

            p.pass('west').always(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), false);
                assert.equal(Latte.isE(spy2.args[0]), false);
                assert.equal(spy1.args[0], 'test');
                assert.equal(spy2.args[0], 'west');
                done();
            }, 50);
        });

        it('in chain', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(5);
                });

            p.pass('test').pass('west').always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'west');
                done();
            }, 50);
        });

        it('return new promise', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(5);
                });

            p.pass(Latte.Promise(function(h){
                h(15);
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 15);
                done();
            }, 50);
        });

        it('not same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.pass();

            assert.equal(p1 === p2, false);
        });
    });

    describe('fdip', function(){

        it('not call in init', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){});

            p.fdip(spy2).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                assert.equal(spy2.called, false);
                done();
            }, 50);
        });

        it('not pass arguments', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h(5);
                });

            p.fdip(function(){
                spy2.apply(null, arguments);
                return function(v){
                    return v;
                };
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy2.args.length, 0);
                assert.equal(spy.args[0], 5);
                done();
            }, 50);
        });

        it('not init if E', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.fdip(spy2).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy2.called, false);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 50);
        });

        it('with context', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(5);
                });

            p.fdip(function(){
                var p = this.prefix;
                return function(v){
                    return p + v;
                };
            }, {prefix : '!!'}).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], '!!5');
                done();
            }, 50);
        });

        it('return E', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(5);
                });

            p.fdip(function(){
                return function(v){
                    return Latte.E('error: ' + v);
                };
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error: 5');
                done();
            }, 50);
        });

        it('return promise', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(5);
                });

            p.fdip(function(){
                return function(v){
                    return Latte.Promise(function(h){
                        h(5 + v);
                    });
                };
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 10);
                done();
            }, 50);
        });

        it('not same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.fdip();

            assert.equal(p1 === p2, false);
        });
    });

    describe('efmap', function(){
        describe('return not Latte', function(){
            it('call', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.E('new ' + v.value);
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'new error');
                    done();
                }, 50);
            });

            it('repair', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return 'repair ' + v.value;
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], 'repair error');
                    done();
                }, 50);
            });

            it('not call if not E', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Promise(function(h){
                        h('test');
                    });

                p.efmap(spy1).always(spy2);

                setTimeout(function(){
                    assert.equal(spy1.called, false);
                    assert.equal(Latte.isE(spy2.args[0]), false);
                    assert.equal(spy2.args[0], 'test');
                    done();
                }, 50);
            });

            it('call handler with context', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.E(this.prefix + ' ' + v.value);
                }, {prefix: 'new'}).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'new error');
                    done();
                }, 50);
            });

            it('from one promise', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.E(v.value + '-1');
                }).always(spy1);

                p.efmap(function(v){
                    return Latte.E(v.value + '-2');
                }).always(spy2);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy1.args[0]), true);
                    assert.equal(Latte.isE(spy2.args[0]), true);
                    assert.equal(spy1.args[0].value, 'error-1');
                    assert.equal(spy2.args[0].value, 'error-2');
                    done();
                }, 50);
            });

            it('in chain', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.E('[' + v.value + ']');
                }).efmap(function(v){
                    return Latte.E('(' + v.value + ')');
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, '([error])');
                    done();
                }, 50);
            });

            it('not same instance', function(){
                var p1 = Latte.Promise(function(){
                    }),
                    p2 = p1.efmap(function(){
                    });

                assert.equal(p1 === p2, false);
            });
        });

        describe('return Latte', function(){

            it('call', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Promise(function(h){
                        h(Latte.E('new ' + v.value));
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'new error');
                    done();
                }, 50);
            });

            it('repair', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Promise(function(h){
                        h('repair ' + v.value);
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], 'repair error');
                    done();
                }, 50);
            });

            it('not call if not E', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Promise(function(h){
                        h('test');
                    });

                p.efmap(spy1).always(spy2);

                setTimeout(function(){
                    assert.equal(spy1.called, false);
                    assert.equal(Latte.isE(spy2.args[0]), false);
                    assert.equal(spy2.args[0], 'test');
                    done();
                }, 50);
            });

            it('call handler with context', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Promise(function(h){
                        h(Latte.E(this.prefix + ' ' + v.value));
                    }, this);
                }, {prefix : 'new'}).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'new error');
                    done();
                }, 50);
            });

            it('from one promise', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Promise(function(h){
                        h(Latte.E('(' + v.value + ')'));
                    })
                }).always(spy1);

                p.efmap(function(v){
                    return Latte.Promise(function(h){
                        h(Latte.E('[' + v.value + ']'));
                    })
                }).always(spy2);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy1.args[0]), true);
                    assert.equal(Latte.isE(spy2.args[0]), true);
                    assert.equal(spy1.args[0].value, '(error)');
                    assert.equal(spy2.args[0].value, '[error]');
                    done();
                }, 50);
            });

            it('from one promise with different result', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Promise(function(h){
                        h(Latte.E('(' + v.value + ')'));
                    })
                }).always(spy1);

                p.efmap(function(v){
                    return Latte.Promise(function(h){
                        h('[' + v.value + ']');
                    })
                }).always(spy2);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy1.args[0]), true);
                    assert.equal(Latte.isE(spy2.args[0]), false);
                    assert.equal(spy1.args[0].value, '(error)');
                    assert.equal(spy2.args[0], '[error]');
                    done();
                }, 50);
            });

            it('in chain', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Promise(function(h){
                        h(Latte.E('[' + v.value + ']'));
                    });
                }).efmap(function(v){
                    return Latte.Promise(function(h){
                        h(Latte.E('(' + v.value + ')'));
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, '([error])');
                    done();
                }, 50);
            });

            it('in chain repair', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Promise(function(h){
                        h(Latte.E('[' + v.value + ']'));
                    });
                }).efmap(function(v){
                    return Latte.Promise(function(h){
                        h('(' + v.value + ')');
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '([error])');
                    done();
                }, 50);
            });

            it('nested', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Promise(function(h){
                        h(Latte.E('[' + v.value + ']'));
                    }).efmap(function(v){
                        return Latte.Promise(function(h){
                            h(Latte.E('(' + v.value + ')'));
                        });
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, '([error])');
                    done();
                }, 50);
            });

            it('nested repair', function(done){
                var spy = fspy(),
                    p = Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Promise(function(h){
                        h(Latte.E('[' + v.value + ']'));
                    }).efmap(function(v){
                        return Latte.Promise(function(h){
                            h('(' + v.value + ')');
                        });
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '([error])');
                    done();
                }, 50);
            });

            it('not same instance', function(){
                var p1 = Latte.Promise(function(){}),
                    p2 = p1.efmap(function(){
                        return p1;
                    });

                assert.equal(p1 === p2, false);
            });
        });
    });

    describe('debounce', function(){

        it('call', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.debounce(20).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);

                setTimeout(function(){
                    assert.equal(spy.called, true);
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], 'test');
                    done();
                }, 40);
            }, 10)
        });

        it('call if E', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.debounce(20).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);

                setTimeout(function(){
                    assert.equal(spy.called, true);
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'error');
                    done();
                }, 40);
            }, 10)
        });

        it('not same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.debounce(10);

            assert.equal(p1 === p2, false);
        });
    });

    describe('throttle', function(){

        it('call', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.throttle(20).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);

                setTimeout(function(){
                    assert.equal(spy.called, true);
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], 'test');
                    done();
                }, 40);
            }, 10)
        });

        it('call if E', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.throttle(20).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);

                setTimeout(function(){
                    assert.equal(spy.called, true);
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'error');
                    done();
                }, 40);
            }, 10)
        });

        it('not same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.throttle(10);

            assert.equal(p1 === p2, false);
        });
    });

    describe('combine', function(){

        it('call', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test-1');
                });

            p.combine(Latte.Promise(function(h){
                h('test-2');
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-1","test-2"]');
                done();
            }, 40);
        });

        it('call with simple type argument', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test-1');
                });

            p.combine('test-2').always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-1","test-2"]');
                done();
            }, 40);
        });

        it('call handler only if all filled', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test-1');
                });

            p.combine(Latte.Promise(function(h){})).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 40);
        });

        it('call handler only if all filled 2', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){});

            p.combine(Latte.Promise(function(h){
                h('test-2');
            })).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 40);
        });

        it('call if E', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.combine(Latte.Promise(function(h){
                h('test-2');
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('call if E 2', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test-1');
                });

            p.combine(Latte.Promise(function(h){
                h(Latte.E('error'));
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('call if E 3', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error-1'));
                });

            p.combine(Latte.Promise(function(h){
                h(Latte.E('error-2'));
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error-1');
                done();
            }, 40);
        });

        it('call if E 4', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error-1'));
                });

            p.combine(Latte.E('error-2')).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error-1');
                done();
            }, 40);
        });

        it('call with empty array', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test-1');
                });

            p.combine([]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-1"]');
                done();
            }, 40);
        });

        it('call with not empty array', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test-1');
                });

            p.combine([
                Latte.Promise(function(h){
                    h('test-2');
                }),
                Latte.Promise(function(h){
                    h('test-3');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-1","test-2","test-3"]');
                done();
            }, 40);
        });

        it('not same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.combine([]);

            assert.equal(p1 === p2, false);
        });
    });

    describe('any', function(){

        it('call if first fullfiled', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test-1');
                });

            p.any(Latte.Promise(function(h){})).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-1");
                done();
            }, 40);
        });

        it('call with simple type argument', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test-1');
                });

            p.any('test-2').always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test-1');
                done();
            }, 40);
        });

        it('call if second fullfiled', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){});

            p.any(Latte.Promise(function(h){
                h('test-2');
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-2");
                done();
            }, 40);
        });

        it('call if both fullfiled', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test-1');
                });

            p.any(Latte.Promise(function(h){
                h('test-2');
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-1");
                done();
            }, 40);
        });

        it('call if first E', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.any(Latte.Promise(function(h){
                h('test-2');
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('call if second E', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test-1');
                });

            p.any(Latte.Promise(function(h){
                h(Latte.E('error'));
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test-1');
                done();
            }, 40);
        });

        it('call if second E 2', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test-1');
                });

            p.any(Latte.E('error')).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test-1');
                done();
            }, 40);
        });

        it('call with empty array', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test-1');
                });

            p.any([]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-1");
                done();
            }, 40);
        });

        it('call with not empty array', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test-1');
                });

            p.any([
                Latte.Promise(function(h){
                    h('test-2');
                }),
                Latte.Promise(function(h){
                    h('test-3');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-1");
                done();
            }, 40);
        });

        it('not same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.any([]);

            assert.equal(p1 === p2, false);
        });
    });

    describe('gacc', function(){

        it('return', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.gacc(function*(v){
                return v;
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test");
                done();
            }, 40);
        });

        it('not call if E', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.gacc(function*(v){
                spy2();
                return v;
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, "error");
                assert.equal(spy2.called, false);
                done();
            }, 40);
        });

        it('call with context', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.gacc(function*(v){
                return this.prefix + v;
            }, {prefix : '!!'}).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "!!test");
                done();
            }, 40);
        });

        it('emulate generator', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.gacc(function(){
                return {
                    next : function(v){
                        return {done : true, value : v};
                    }
                };
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test");
                done();
            }, 40);
        });

        it('not same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.gacc(function*(){});

            assert.equal(p1 === p2, false);
        });
    });

    describe('log', function(){

        it('call', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.log().always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 40);
        });

        it('call if E', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.log().always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.log();

            assert.equal(p1 === p2, true);
        });
    });
});

describe('Promise static', function(){

    describe('init', function(){

        it('set value', function(done){
            var spy = fspy(),
                p = Latte.Promise.init('test');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 40);
        });

        it('set E', function(done){
            var spy = fspy(),
                p = Latte.Promise.init(Latte.E('error'));

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('set and unpack promise', function(done){
            var spy = fspy(),
                p = Latte.Promise.init(Latte.Promise.init('value'));

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'value');
                done();
            }, 40);
        });

    });

    describe('collectAll', function(){

        it('call', function(done){
            var spy = fspy();

            Latte.Promise.collectAll([
                Latte.Promise(function(h){
                    h('test-1');
                }),
                Latte.Promise(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-1","test-2"]');
                done();
            }, 40);
        });

        it('call with simple value', function(done){
            var spy = fspy();

            Latte.Promise.collectAll([
                Latte.Promise(function(h){
                    h('test-1');
                }),
                Latte.Promise(function(h){
                    h('test-2');
                }),
                'test-3'
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-1","test-2","test-3"]');
                done();
            }, 40);
        });

        it('call handler only if all filled', function(done){
            var spy = fspy();

            Latte.Promise.collectAll([
                Latte.Promise(function(h){
                    h('test-1');
                }),
                Latte.Promise(function(h){})
            ]).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 40);
        });

        it('call handler only if all filled 2', function(done){
            var spy = fspy();

            Latte.Promise.collectAll([
                Latte.Promise(function(h){}),
                Latte.Promise(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 40);
        });

        it('call if E', function(done){
            var spy = fspy();

            Latte.Promise.collectAll([
                Latte.Promise(function(h){
                    h(Latte.E('error'));
                }),
                Latte.Promise(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(Latte.isE(spy.args[0].value[0]), true);
                assert.equal(Latte.isE(spy.args[0].value[1]), false);

                assert.equal(spy.args[0].value[0].value, 'error');
                assert.equal(spy.args[0].value[1], 'test-2');

                done();
            }, 40);
        });

        it('call if E 2', function(done){
            var spy = fspy();

            Latte.Promise.collectAll([
                Latte.Promise(function(h){
                    h('test-1');
                }),
                Latte.Promise(function(h){
                    h(Latte.E('error'));
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(Latte.isE(spy.args[0].value[0]), false);
                assert.equal(Latte.isE(spy.args[0].value[1]), true);

                assert.equal(spy.args[0].value[0], 'test-1');
                assert.equal(spy.args[0].value[1].value, 'error');
                done();
            }, 40);
        });

        it('call with empty array', function(done){
            var spy = fspy();

            Latte.Promise.collectAll([]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '[]');
                done();
            }, 40);
        });
    });

    describe('collect', function(){

        it('call', function(done){
            var spy = fspy();

            Latte.Promise.collect([
                Latte.Promise(function(h){
                    h('test-1');
                }),
                Latte.Promise(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-1","test-2"]');
                done();
            }, 40);
        });

        it('call with simple value', function(done){
            var spy = fspy();

            Latte.Promise.collect([
                Latte.Promise(function(h){
                    h('test-1');
                }),
                Latte.Promise(function(h){
                    h('test-2');
                }),
                'test-3'
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-1","test-2","test-3"]');
                done();
            }, 40);
        });

        it('call handler only if all filled', function(done){
            var spy = fspy();

            Latte.Promise.collect([
                Latte.Promise(function(h){
                    h('test-1');
                }),
                Latte.Promise(function(h){})
            ]).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 40);
        });

        it('call handler only if all filled 2', function(done){
            var spy = fspy();

            Latte.Promise.collect([
                Latte.Promise(function(h){}),
                Latte.Promise(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 40);
        });

        it('call if E', function(done){
            var spy = fspy();

            Latte.Promise.collect([
                Latte.Promise(function(h){
                    h(Latte.E('error'));
                }),
                Latte.Promise(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('call if E 2', function(done){
            var spy = fspy();

            Latte.Promise.collect([
                Latte.Promise(function(h){
                    h('test-1');
                }),
                Latte.Promise(function(h){
                    h(Latte.E('error'));
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('call if E 3', function(done){
            var spy = fspy();

            Latte.Promise.collect([
                Latte.Promise(function(h){
                    h(Latte.E('error-1'));
                }),
                Latte.Promise(function(h){
                    h(Latte.E('error-2'));
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error-1');
                done();
            }, 40);
        });

        it('call with empty array', function(done){
            var spy = fspy();

            Latte.Promise.collect([]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '[]');
                done();
            }, 40);
        });
    });

    describe('any', function(){

        it('call if first fullfiled', function(done){
            var spy = fspy();

            Latte.Promise.any([
                Latte.Promise(function(h){
                    h('test-1');
                }),
                Latte.Promise(function(h){})
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-1");
                done();
            }, 40);
        });

        it('call if second fullfiled', function(done){
            var spy = fspy();

            Latte.Promise.any([
                Latte.Promise(function(h){}),
                Latte.Promise(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-2");
                done();
            }, 40);
        });

        it('call if both fullfiled', function(done){
            var spy = fspy();

            Latte.Promise.any([
                Latte.Promise(function(h){
                    h('test-1');
                }),
                Latte.Promise(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-1");
                done();
            }, 40);
        });

        it('call if first E', function(done){
            var spy = fspy();

            Latte.Promise.any([
                Latte.Promise(function(h){
                    h(Latte.E('error'));
                }),
                Latte.Promise(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('call if second E', function(done){
            var spy = fspy();

            Latte.Promise.any([
                Latte.Promise(function(h){
                    h('test-1');
                }),
                Latte.Promise(function(h){
                    h(Latte.E('error'));
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test-1');
                done();
            }, 40);
        });

        it('call with empty array', function(done){
            var spy = fspy();

            Latte.Promise.any([]).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 40);
        });
    });

    describe('fun', function(){

        it('call with one simple argument', function(done){
            var spy = fspy(),
                p = Latte.Promise.fun(function(a){
                    return a;
                })('test');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 40);
        });

        it('call with context', function(done){
            var spy = fspy(),
                p = Latte.Promise.fun(function(a){
                    return this.prefix + a;
                }, {prefix : 'value-'})('test');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'value-test');
                done();
            }, 40);
        });

        it('call with several simple arguments', function(done){
            var spy = fspy(),
                p = Latte.Promise.fun(function(a, b, c){
                    return [a, b, c].toString();
                })('test', 'rest', 'west');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test,rest,west');
                done();
            }, 40);
        });

        it('call with E', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                p = Latte.Promise.fun(function(a){
                    spy2();
                    return a;
                })(Latte.E('error'));

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy2.called, false);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('call with promise', function(done){
            var spy = fspy(),
                p = Latte.Promise.fun(function(a){
                    return a;
                })(Latte.Promise(function(h){
                    setTimeout(function(){
                        h('test');
                    }, 0)
                }));

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 40);
        });

        it('call with several promises', function(done){
            var spy = fspy(),
                p = Latte.Promise.fun(function(a, b){
                    return [a, b].toString();
                })(Latte.Promise(function(h){
                    setTimeout(function(){
                        h('test');
                    }, 0)
                }), Latte.Promise(function(h){
                    h('rest');
                }));

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test,rest');
                done();
            }, 40);
        });

        it('call with complex arguments', function(done){
            var spy = fspy(),
                p = Latte.Promise.fun(function(a, b, c){
                    return Array.prototype.slice.call(arguments).toString();
                })(Latte.Promise(function(h){
                    setTimeout(function(){
                        h('test');
                    }, 0)
                }), Latte.Promise(function(h){
                    h('rest');
                }), 'west');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test,rest,west');
                done();
            }, 40);
        });

        it('call with complex arguments with E', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                p = Latte.Promise.fun(function(a, b, c){
                    spy2();
                    return [a, b, c].toString();
                })(Latte.Promise(function(h){
                    setTimeout(function(){
                        h(Latte.E('error'));
                    }, 0)
                }), Latte.Promise(function(h){
                    h('rest');
                }), 'west');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                assert.equal(spy2.called, false);
                done();
            }, 40);
        });

        it('return E', function(done){
            var spy = fspy(),
                p = Latte.Promise.fun(function(a){
                    return Latte.E('error');
                })('test');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('return promise', function(done){
            var spy = fspy(),
                p = Latte.Promise.fun(function(a){
                    return Latte.Promise(function(h){
                        h(a);
                    });
                })('test');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 40);
        });

        it('return promise with E', function(done){
            var spy = fspy(),
                p = Latte.Promise.fun(function(a){
                    return Latte.Promise(function(h){
                        h(Latte.E('error'));
                    });
                })('test');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('with callback', function(done){
            var spy = fspy(),
                p = Latte.Promise.fun(setTimeout)(Latte.callback(function(){
                    return 'test';
                }), 0);

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 40);
        });

        it('with 2 callbacks', function(done){
            var spy = fspy(),
                p = Latte.Promise.fun(function(f, g){
                    g('test');
                })(Latte.callback(function(v){
                    return '[' + v + ']';
                }), Latte.callback(function(v){
                    return '(' + v + ')';
                }));

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], '(test)');
                done();
            }, 40);
        });

        it('with callback ignore return', function(done){
            var spy = fspy(),
                p = Latte.Promise.fun(function(f){
                    f('test');
                    return 'rest';
                })(Latte.callback(function(){
                    return 'test';
                }));

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 40);
        });
    });

    describe('gen', function(){

        it('call', function(done){
            var spy = fspy(),
                g = Latte.Promise.gen(function*(){
                    return 'test';
                })();

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 40);
        });

        it('call with context', function(done){
            var spy = fspy(),
                g = Latte.Promise.gen(function*(){
                    return this.value;
                }, {value : 'test'})();

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 40);
        });

        it('call with arguments', function(done){
            var spy = fspy(),
                g = Latte.Promise.gen(function*(){
                    return Array.prototype.slice.call(arguments).toString();
                })('test', 'rest');

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test,rest');
                done();
            }, 40);
        });

        it('call with promise as argument', function(done){
            var spy = fspy(),
                g = Latte.Promise.gen(function*(v){
                    return v;
                })(Latte.Promise(function(h){
                    h('test');
                }));

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 40);
        });

        it('not call if E', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                g = Latte.Promise.gen(function*(v){
                    spy2();
                    return v;
                })(Latte.E('error'));

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy2.called, false);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('call with yield', function(done){
            var spy = fspy(),
                g = Latte.Promise.gen(function*(a){
                    var b = yield [a].concat('rest'),
                        c = yield Latte.Promise(function(h){
                            h(b.concat('west'));
                        });

                    return c.toString();
                })('test');

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test,rest,west');
                done();
            }, 40);
        });

        it('E in generator', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                g = Latte.Promise.gen(function*(a){
                    var b = yield Latte.E('error');
                    spy2();
                    var c = yield Latte.Promise(function(h){
                        h(b.concat('west'));
                    });

                    return c.toString();
                })('test');

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy2.called, false);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('return promise', function(done){
            var spy = fspy(),
                g = Latte.Promise.gen(function*(a){
                    return Latte.Promise(function(h){
                        h('rest');
                    });
                })('test');

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'rest');
                done();
            }, 40);
        });
    });
});

describe('Promise shell', function(){

    it('without value', function(done){
        var spy = fspy(),
            s = Latte.Promise.shell();

        s.out().always(spy);

        setTimeout(function(){
            assert.equal(spy.called, false);
            done();
        }, 40);
    });

    it('out method return same instance', function(){
        var spy = fspy(),
            s = Latte.Promise.shell();

        assert.equal(s.out() === s.out(), true);
    });

    it('set value', function(done){
        var spy = fspy(),
            s = Latte.Promise.shell();

        s.out().always(spy);
        s.set('test');

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test');
            done();
        }, 40);
    });

    it('set promise', function(done){
        var spy = fspy(),
            s = Latte.Promise.shell();

        s.out().always(spy);
        s.set(Latte.Promise(function(h){
            h('test');
        }));

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test');
            done();
        }, 40);
    });

    it('set stream', function(done){
        var spy = fspy(),
            s = Latte.Promise.shell();

        s.out().always(spy);
        s.set(Latte.Stream(function(h){
            h('test');
        }));

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test');
            done();
        }, 40);
    });

    it('ignore set value twice', function(done){
        var spy = fspy(),
            s = Latte.Promise.shell();

        s.out().always(spy);
        s.set('test-1').set('test-2');

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test-1');
            done();
        }, 40);
    });

    it('out method return common promise instance', function(){
        var s = Latte.Promise.shell(),
            out = s.out();

        assert.equal(typeof out.set === 'undefined', true);
        assert.equal(typeof out.out === 'undefined', true);
    });
});

describe('Stream instance', function(){

    describe('common', function(){

        it('isPromise', function(){
            var p = Latte.Stream(function(){});

            assert.equal(Latte.isPromise(p), false);
        });

        it('isStream', function(){
            var p = Latte.Stream(function(){});

            assert.equal(Latte.isStream(p), true);
        });

        it('isLatte', function(){
            var p = Latte.Stream(function(){});

            assert.equal(Latte.isLatte(p), true);
        });

        it('not call', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(){
                    return 'test';
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50);
        });

        it('call with & without new operator', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p1 = Latte.Stream(function(h){
                    h('test');
                }),
                p2 = Latte.Stream(function(h){
                    h('test');
                });

            p1.always(spy1);
            p2.always(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), false);
                assert.equal(Latte.isE(spy2.args[0]), false);
                assert.equal(spy1.args[0], 'test');
                assert.equal(spy2.args[0], 'test');
                done();
            }, 50);
        });

        it('call handler without value', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h();
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], undefined);
                done();
            }, 50);
        });

        it('call repeatedly', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h('test');
                        h('rest');
                        h('west');
                    }, 0);
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(spy.count, 3);
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'west');
                done();
            }, 50);
        });

        it('call repeatedly & take last value', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                    h('rest');
                    h('west');
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(spy.count, 1);
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'west');
                done();
            }, 50);
        });

        it('call executor with context', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(this.value);
                }, {value : 'test'});

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('ignore return value in executor', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                    return this;
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('second arguments as prev value', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                    h('west');
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'west');
                done();
            }, 50);
        });

        it('promise as value', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.Promise(function(h2){
                        h2('test');
                    }));
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                
                done();
            }, 50);
        });

        it('stream as value', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.Stream(function(h2){
                        h2('test');
                    }));
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                
                done();
            }, 50);
        });
    });

    describe('always', function(){

        it('for success value', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                    h('rest');
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'rest');
                done();
            }, 50);
        });

        it('for error value', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                    h(Latte.E('error'));
                });

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 50);
        });

        it('call handler with context', function(done){
            var ctx = {value : null},
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.always(function(v){
                this.value = v;
            }, ctx);

            setTimeout(function(){
                assert.equal(Latte.isE(ctx.value), false);
                assert.equal(ctx.value, 'test');
                done();
            }, 50);
        });

        it('from one stream', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.E('error'));
                });

            p.always(spy1);
            p.always(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), true);
                assert.equal(Latte.isE(spy2.args[0]), true);
                assert.equal(spy1.args[0].value, 'error');
                assert.equal(spy2.args[0].value, 'error');
                done();
            }, 50);
        });

        it('in chain', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.always(spy1).always(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), false);
                assert.equal(Latte.isE(spy2.args[0]), false);
                assert.equal(spy1.args[0], 'test');
                assert.equal(spy2.args[0], 'test');
                done();
            }, 50);
        });

        it('ignore return value in handler', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.always(function(v){
                return 'west';
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('catch distant E', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.fmap(function(){
                return Latte.E('error');
            }).fmap(function(v){
                return v;
            }).fmap(function(v){
                return Latte.Stream(function(h){
                    h(v);
                });
            }).pass('test').always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                
                done();
            }, 50);
        });

        it('same instance', function(){
            var p1 = Latte.Stream(function(){}),
                p2 = p1.always(function(){});

            assert.equal(p1 === p2, true);
        });
    });

    describe('next', function(){

        it('call', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                    h('west');
                    h('rest');
                });

            p.next(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'rest');
                done();
            }, 50);
        });

        it('not call if E', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h(Latte.E('error'));
                        h('test');
                    }, 0);
                });

            p.next(spy);

            setTimeout(function(){
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('call handler with context', function(done){
            var ctx = {value : null},
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.next(function(v){
                this.value = v;
            }, ctx);

            setTimeout(function(){
                assert.equal(Latte.isE(ctx.value), false);
                assert.equal(ctx.value, 'test');
                done();
            }, 50);
        });

        it('from one stream', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.next(spy1);
            p.next(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), false);
                assert.equal(Latte.isE(spy2.args[0]), false);
                assert.equal(spy1.args[0], 'test');
                assert.equal(spy2.args[0], 'test');
                done();
            }, 50);
        });

        it('in chain', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.next(spy1).next(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), false);
                assert.equal(Latte.isE(spy2.args[0]), false);
                assert.equal(spy1.args[0], 'test');
                assert.equal(spy2.args[0], 'test');
                done();
            }, 50);
        });

        it('ignore return value in handler', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.next(function(){
                return 'west';
            }).next(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('same instance', function(){
            var p1 = Latte.Stream(function(){}),
                p2 = p1.next(function(){});

            assert.equal(p1 === p2, true);
        });
    });

    describe('fail', function(){

        it('call', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h('test');
                        h(Latte.E('error'));
                    }, 0);
                });

            p.fail(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 50);
        });

        it('not call if not E', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('error');
                });

            p.fail(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50);
        });

        it('call handler with context', function(done){
            var ctx = {value : null},
                p = Latte.Stream(function(h){
                    h(Latte.E('error'));
                });

            p.fail(function(v){
                this.value = v.value;
            }, ctx);

            setTimeout(function(){
                assert.equal(ctx.value, 'error');
                done();
            }, 50);
        });

        it('from one stream', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.E('error'));
                });

            p.fail(spy1);
            p.fail(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), true);
                assert.equal(Latte.isE(spy2.args[0]), true);
                assert.equal(spy1.args[0].value, 'error');
                assert.equal(spy2.args[0].value, 'error');
                done();
            }, 50);
        });

        it('in chain', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.E('error'));
                });

            p.fail(spy1).fail(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), true);
                assert.equal(Latte.isE(spy2.args[0]), true);
                assert.equal(spy1.args[0].value, 'error');
                assert.equal(spy2.args[0].value, 'error');
                done();
            }, 50);
        });

        it('ignore return value in handler', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.E('error'));
                });

            p.fail(function(e){
                return Latte.E('new error');
            }).fail(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 50);
        });

        it('catch distant E', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.fmap(function(){
                return Latte.E('error');
            }).fmap(function(v){
                return v;
            }).fmap(function(v){
                return Latte.Stream(function(h){
                    h(v);
                });
            }).pass('test').always(spy1).fail(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), true);
                assert.equal(Latte.isE(spy2.args[0]), true);
                assert.equal(spy1.args[0].value, 'error');
                assert.equal(spy2.args[0].value, 'error');
                done();
            }, 50);
        });

        it('same instance', function(){
            var p1 = Latte.Stream(function(){}),
                p2 = p1.fail(function(){});

            assert.equal(p1 === p2, true);
        });
    });

    describe('when', function(){

        it('if true result', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h(2);
                        h(5);
                    }, 0);
                });

            p.when(function(x){
                return x > 0;
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 5);
                done();
            }, 50);
        });

        it('if false result', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h(-100);
                        h(-5);
                    }, 0);
                });

            p.when(function(x){
                return x > 0;
            }).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50);
        });

        it('if true & false results', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h(2);
                        h(-12);
                        h(5);
                        h(-1111);
                    }, 0);
                });

            p.when(function(x, y){
                return x > 0;
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 5);
                done();
            }, 50);
        });

        it('coercion to boolean', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(0);
                });

            p.when(function(x){
                return x;
            }).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50);
        });

        it('not call if E, but do not break chain', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h(Latte.E('error'));
                    }, 0);
                });

            p.when(spy1).always(spy2);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.called, true);
                assert.equal(Latte.isE(spy2.args[0]), true);
                assert.equal(spy2.args[0].value, 'error');
                done();
            }, 50);
        });

        it('call handler with context', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.when(function(v){
                return v === this.value;
            }, {value : 'test'}).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('from one stream', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h(5);
                        h(12);
                    }, 0);
                });

            p.when(function(x){
                return x > 0;
            }).always(spy1);

            p.when(function(x){
                return x <= 0;
            }).always(spy2);

            setTimeout(function(){
                assert.equal(spy1.called, true);
                assert.equal(spy1.args[0], 12);
                assert.equal(spy2.called, false);
                done();
            }, 50);
        });

        it('in chain', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h(-100);
                        h(5);
                    });
                });

            p.when(function(x){
                return x > 0;
            }).when(function(x, y){
                return x === 4;
            }).always(spy1);

            p.when(function(x){
                return x > 0;
            }).when(function(x){
                return x === 5;
            }).always(spy2);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.called, true);
                done();
            }, 50);
        });

        it('not same instance', function(){
            var p1 = Latte.Stream(function(){}),
                p2 = p1.when(function(){});

            assert.equal(p1 === p2, false);
        });
    });

    describe('unless', function(){

        it('if true result', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h(2);
                        h(5);
                    }, 0);
                });

            p.unless(function(x){
                return x < 0;
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 5);
                done();
            }, 50);
        });

        it('if false result', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h(-100);
                        h(-5);
                    }, 0);
                });

            p.unless(function(x){
                return x < 0;
            }).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50);
        });

        it('if true & false results', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h(-2);
                        h(12);
                        h(-5);
                        h(1111);
                    }, 0);
                });

            p.unless(function(x){
                return x > 0;
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], -5);
                done();
            }, 50);
        });

        it('coercion to boolean', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(5);
                });

            p.unless(function(x){
                return x;
            }).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 50);
        });

        it('not call if E, but do not break chain', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.E('error'));
                });

            p.unless(spy1).always(spy2);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.called, true);
                assert.equal(Latte.isE(spy2.args[0]), true);
                assert.equal(spy2.args[0].value, 'error');
                done();
            }, 50);
        });

        it('call handler with context', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.unless(function(v){
                return v === this.value;
            }, {value : 'west'}).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('from one stream', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h(5);
                });

            p.unless(function(x){
                return x < 0;
            }).always(spy1);

            p.unless(function(x){
                return x >= 0;
            }).always(spy2);

            setTimeout(function(){
                assert.equal(spy1.called, true);
                assert.equal(spy2.called, false);
                done();
            }, 50);
        });

        it('in chain', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h(5);
                });

            p.unless(function(x){
                return x < 0;
            }).unless(function(x){
                return x === 5;
            }).always(spy1);

            p.unless(function(x){
                return x < 0;
            }).unless(function(x){
                return x === 4;
            }).always(spy2);

            setTimeout(function(){
                assert.equal(spy1.called, false);
                assert.equal(spy2.called, true);
                done();
            }, 50);
        });

        it('not same instance', function(){
            var p1 = Latte.Stream(function(){}),
                p2 = p1.unless(function(){});

            assert.equal(p1 === p2, false);
        });
    });

    describe('fmap', function(){

        describe('return not Latte', function(){
            it('call', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        setTimeout(function(){
                            h('test');
                            h('west');
                        }, 0);
                    });

                p.fmap(function(v){
                    return '(' + v + ')';
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '(west)');
                    done();
                }, 50);
            });

            it('return E', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        setTimeout(function(){
                            h('test');
                            h('west');
                        }, 0);
                    });

                p.fmap(function(v){
                    return Latte.E('error');
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'error');
                    done();
                }, 50);
            });

            it('not call if E, but do not brake chain', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Stream(function(h){
                        setTimeout(function(){
                            h(Latte.E('error-1'));
                            h(Latte.E('error-2'));
                        }, 0);
                    });

                p.fmap(spy1).always(spy2);

                setTimeout(function(){
                    assert.equal(spy1.called, false);
                    assert.equal(Latte.isE(spy2.args[0]), true);
                    assert.equal(spy2.args[0].value, 'error-2');
                    done();
                }, 50);
            });

            it('call handler with context', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        setTimeout(function(){
                            h(Latte.E('error'));
                            h('test');
                        }, 0);
                    });

                p.fmap(function(v){
                    return this.prefix + v + this.suffix;
                }, {prefix : '(', suffix : ')'}).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '(test)');
                    done();
                }, 50);
            });

            it('from one stream', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Stream(function(h){
                        h(5);
                    });

                p.fmap(function(x){
                    return x * 2;
                }).always(spy1);

                p.fmap(function(x){
                    return x * 5;
                }).always(spy2);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy1.args[0]), false);
                    assert.equal(Latte.isE(spy2.args[0]), false);
                    assert.equal(spy1.args[0], 10);
                    assert.equal(spy2.args[0], 25);
                    done();
                }, 50);
            });

            it('in chain', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        h(5);
                    });

                p.fmap(function(x){
                    return x * 2;
                }).fmap(function(x){
                    return x * 5;
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], 50);
                    
                    done();
                }, 50);
            });

            it('not same instance', function(){
                var p1 = Latte.Stream(function(){}),
                    p2 = p1.fmap(function(){});

                assert.equal(p1 === p2, false);
            });
        });

        describe('return Latte', function(){

            it('call', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        setTimeout(function(){
                            h('test');
                            h('rest');
                        });
                    });

                p.fmap(function(v){
                    return Latte.Promise(function(h){
                        h('(' + v + ')');
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '(rest)');
                    done();
                }, 50);
            });

            it('return E', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        setTimeout(function(){
                            h('test');
                            h('west');
                        }, 0);
                    });

                p.fmap(function(v){
                    return Latte.Stream(function(h){
                        h(Latte.E('error'));
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'error');
                    done();
                }, 50);
            });

            it('not call if E, but do not break chain', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        h(Latte.E('error'));
                    });

                p.fmap(function(v){
                    return Latte.Stream(function(h){
                        h('(' + v + ')');
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'error');
                    
                    done();
                }, 50);
            });

            it('call handler with context', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        h('test');
                    });

                p.fmap(function(v){
                    return Latte.Stream(function(h){
                        h(this.prefix + v + this.suffix);
                    }, this);
                }, {prefix : '(', suffix : ')'}).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '(test)');
                    done();
                }, 50);
            });

            it('from one stream', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Stream(function(h){
                        h('test');
                    });

                p.fmap(function(v){
                    return Latte.Stream(function(h){
                        h('(' + v + ')');
                    })
                }).always(spy1);

                p.fmap(function(v){
                    return Latte.Stream(function(h){
                        h('[' + v + ']');
                    })
                }).always(spy2);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy1.args[0]), false);
                    assert.equal(Latte.isE(spy2.args[0]), false);
                    assert.equal(spy1.args[0], '(test)');
                    assert.equal(spy2.args[0], '[test]');
                    done();
                }, 50);
            });

            it('in chain', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        h('test');
                    });

                p.fmap(function(v){
                    return Latte.Stream(function(h){
                        setTimeout(function(){
                            h('[' + v + ']');
                            h('{' + v + '}');
                        }, 0);
                    });
                }).fmap(function(v){
                    return Latte.Stream(function(h){
                        h('(' + v + ')');
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '({test})');
                    done();
                }, 50);
            });

            it('nested', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        h('test');
                    });

                p.fmap(function(v){
                    return Latte.Stream(function(h){
                        h('[' + v + ']');
                    }).fmap(function(v){
                        return Latte.Stream(function(h){
                            setTimeout(function(){
                                h('(' + v + ')');
                                h('{' + v + '}');
                            }, 0);
                        });
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '{[test]}');
                    done();
                }, 50);
            });

            it('not same instance', function(){
                var p1 = Latte.Stream(function(){}),
                    p2 = p1.fmap(function(){
                        return p1;
                    });

                assert.equal(p1 === p2, false);
            });
        });
    });

    describe('pass', function(){

        it('call with success value', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.pass('west').always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'west');
                
                done();
            }, 50);
        });

        it('call with error value', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.pass(Latte.E('error')).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                
                done();
            }, 50);
        });

        it('call without value', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.pass().always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], undefined);
                
                done();
            }, 50);
        });

        it('not call if E, but do not break chain', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.E('error'));
                });

            p.pass(Latte.E('new error')).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                
                done();
            }, 50);
        });

        it('from one stream', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h(5);
                });

            p.pass('test').always(spy1);

            p.pass('west').always(spy2);

            setTimeout(function(){
                assert.equal(Latte.isE(spy1.args[0]), false);
                assert.equal(Latte.isE(spy2.args[0]), false);
                assert.equal(spy1.args[0], 'test');
                assert.equal(spy2.args[0], 'west');
                done();
            }, 50);
        });

        it('in chain', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h(1);
                        h(5);
                    }, 0);
                });

            p.pass('test').pass('west').always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'west');
                done();
            }, 50);
        });

        it('return new stream', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(5);
                });

            p.pass(Latte.Stream(function(h){
                h(15);
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 15);
                
                done();
            }, 50);
        });

        it('not same instance', function(){
            var p1 = Latte.Stream(function(){}),
                p2 = p1.pass();

            assert.equal(p1 === p2, false);
        });
    });

    describe('fdip', function(){

        it('not call in init', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){});

            p.fdip(spy2).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                assert.equal(spy2.called, false);
                done();
            }, 50);
        });

        it('not pass arguments', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h(5);
                });

            p.fdip(function(){
                spy2.apply(null, arguments);
                return function(v){
                    return v;
                };
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy2.args.length, 0);
                assert.equal(spy.args[0], 5);
                
                done();
            }, 50);
        });

        it('init once', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h(5);
                    setTimeout(function(){
                        h(8);
                    }, 0);
                });

            p.fdip(function(){
                spy2.apply(null, arguments);
                return function(v){
                    return v;
                };
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy2.count, 1);
                assert.equal(spy.args[0], 8);
                done();
            }, 50);
        });

        it('not init if E', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.E('error'));
                });

            p.fdip(spy2).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy2.called, false);
                assert.equal(spy.args[0].value, 'error');
                
                done();
            }, 50);
        });

        it('not init if E & init after not E', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.E('error'));
                    setTimeout(function(){
                        h('test');
                    }, 0);
                });

            p.fdip(function(){
                spy2.apply(null, arguments);
                return function(v){
                    return v;
                }
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy2.called, true);
                assert.equal(spy.args[0], 'test');
                done();
            }, 50);
        });

        it('different instances', function(done){
            var spy1 = fspy(),
                spy2 = fspy(),
                spy3 = fspy(),
                spy4 = fspy(),
                p = Latte.Stream(function(h){
                    h('rest');
                    setTimeout(function(){
                        h('test');
                    }, 0);
                });

            p.fdip(function(){
                spy1.apply(null, arguments);
                return function(v){
                    return '[' + v + ']';
                }
            }).always(spy2);

            p.fdip(function(){
                spy3.apply(null, arguments);
                return function(v){
                    return '(' + v + ')';
                }
            }).always(spy4);

            setTimeout(function(){
                assert.equal(spy1.called, true);
                assert.equal(spy1.count, 1);
                assert.equal(spy3.called, true);
                assert.equal(spy3.count, 1);
                assert.equal(Latte.isE(spy2.args[0]), false);
                assert.equal(Latte.isE(spy4.args[0]), false);
                assert.equal(spy2.args[0], '[test]');
                assert.equal(spy4.args[0], '(test)');
                done();
            }, 50);
        });

        it('with context', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(5);
                });

            p.fdip(function(){
                var p = this.prefix;
                return function(v){
                    return p + v;
                };
            }, {prefix : '!!'}).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], '!!5');
                
                done();
            }, 50);
        });

        it('return E', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(5);
                });

            p.fdip(function(){
                return function(v){
                    return Latte.E('error: ' + v);
                };
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error: 5');
                
                done();
            }, 50);
        });

        it('return stream', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(5);
                });

            p.fdip(function(){
                return function(v){
                    return Latte.Stream(function(h){
                        h(5 + v);
                    });
                };
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 10);
                
                done();
            }, 50);
        });

        it('not same instance', function(){
            var p1 = Latte.Stream(function(){}),
                p2 = p1.fdip();

            assert.equal(p1 === p2, false);
        });
    });

    describe('efmap', function(){
        describe('return not Latte', function(){
            it('call', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        setTimeout(function(){
                            h('test');
                            h(Latte.E('error'));
                        }, 0);
                    });

                p.efmap(function(v){
                    return Latte.E('new ' + v.value);
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'new error');
                    done();
                }, 50);
            });

            it('repair', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return 'repair ' + v.value;
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], 'repair error');
                    
                    done();
                }, 50);
            });

            it('not call if not E', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Stream(function(h){
                        setTimeout(function(){
                            h('test');
                        }, 0);
                    });

                p.efmap(spy1).always(spy2);

                setTimeout(function(){
                    assert.equal(spy1.called, false);
                    assert.equal(Latte.isE(spy2.args[0]), false);
                    assert.equal(spy2.args[0], 'test');
                    done();
                }, 50);
            });

            it('call handler with context', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.E(this.prefix + ' ' + v.value);
                }, {prefix : 'new'}).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'new error');
                    done();
                }, 50);
            });

            it('from one stream', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Stream(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.E(v.value + '-1');
                }).always(spy1);

                p.efmap(function(v){
                    return Latte.E(v.value + '-2');
                }).always(spy2);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy1.args[0]), true);
                    assert.equal(Latte.isE(spy2.args[0]), true);
                    assert.equal(spy1.args[0].value, 'error-1');
                    assert.equal(spy2.args[0].value, 'error-2');
                    done();
                }, 50);
            });

            it('in chain', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.E('[' + v.value + ']');
                }).efmap(function(v){
                    return Latte.E('(' + v.value + ')');
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, '([error])');
                    
                    done();
                }, 50);
            });

            it('not same instance', function(){
                var p1 = Latte.Stream(function(){}),
                    p2 = p1.efmap(function(){});

                assert.equal(p1 === p2, false);
            });
        });

        describe('return Latte', function(){

            it('call', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        setTimeout(function(){
                            h(Latte.E('error-1'));
                            h(Latte.E('error-2'));
                        }, 0);
                    });

                p.efmap(function(v){
                    return Latte.Stream(function(h){
                        h(Latte.E('new ' + v.value));
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'new error-2');
                    done();
                }, 50);
            });

            it('repair', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Stream(function(h){
                        h('repair ' + v.value);
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], 'repair error');
                    
                    done();
                }, 50);
            });

            it('not call if not E', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Stream(function(h){
                        h('test');
                    });

                p.efmap(spy1).always(spy2);

                setTimeout(function(){
                    assert.equal(spy1.called, false);
                    assert.equal(Latte.isE(spy2.args[0]), false);
                    assert.equal(spy2.args[0], 'test');
                    done();
                }, 50);
            });

            it('call handler with context', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Stream(function(h){
                        h(Latte.E(this.prefix + ' ' + v.value));
                    }, this);
                }, {prefix : 'new'}).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'new error');
                    done();
                }, 50);
            });

            it('from one stream', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Stream(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Stream(function(h){
                        setTimeout(function(){
                            h('{' + v.value + '}');
                            h(Latte.E('(' + v.value + ')'));
                        }, 0);
                    })
                }).always(spy1);

                p.efmap(function(v){
                    return Latte.Stream(function(h){
                        h(Latte.E('[' + v.value + ']'));
                    })
                }).always(spy2);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy1.args[0]), true);
                    assert.equal(Latte.isE(spy2.args[0]), true);
                    assert.equal(spy1.args[0].value, '(error)');
                    assert.equal(spy2.args[0].value, '[error]');
                    done();
                }, 50);
            });

            it('from one promise with different result', function(done){
                var spy1 = fspy(),
                    spy2 = fspy(),
                    p = Latte.Stream(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Stream(function(h){
                        h(Latte.E('(' + v.value + ')'));
                    })
                }).always(spy1);

                p.efmap(function(v){
                    return Latte.Stream(function(h){
                        h('[' + v.value + ']');
                    })
                }).always(spy2);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy1.args[0]), true);
                    assert.equal(Latte.isE(spy2.args[0]), false);
                    assert.equal(spy1.args[0].value, '(error)');
                    assert.equal(spy2.args[0], '[error]');
                    done();
                }, 50);
            });

            it('in chain', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Stream(function(h){
                        h(Latte.E('[' + v.value + ']'));
                    });
                }).efmap(function(v){
                    return Latte.Stream(function(h){
                        h(Latte.E('(' + v.value + ')'));
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, '([error])');
                    
                    done();
                }, 50);
            });

            it('in chain repair', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Stream(function(h){
                        h(Latte.E('[' + v.value + ']'));
                    });
                }).efmap(function(v){
                    return Latte.Stream(function(h){
                        h('(' + v.value + ')');
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '([error])');
                    
                    done();
                }, 50);
            });

            it('nested', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Stream(function(h){
                        h(Latte.E('[' + v.value + ']'));
                    }).efmap(function(v){
                        return Latte.Stream(function(h){
                            h(Latte.E('(' + v.value + ')'));
                        });
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, '([error])');
                    
                    done();
                }, 50);
            });

            it('nested repair', function(done){
                var spy = fspy(),
                    p = Latte.Stream(function(h){
                        h(Latte.E('error'));
                    });

                p.efmap(function(v){
                    return Latte.Stream(function(h){
                        h(Latte.E('[' + v.value + ']'));
                    }).efmap(function(v){
                        return Latte.Stream(function(h){
                            h('(' + v.value + ')');
                        });
                    });
                }).always(spy);

                setTimeout(function(){
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], '([error])');
                    
                    done();
                }, 50);
            });

            it('not same instance', function(){
                var p1 = Latte.Stream(function(){}),
                    p2 = p1.efmap(function(){
                        return p1;
                    });

                assert.equal(p1 === p2, false);
            });
        });
    });

    describe('debounce', function(){

        it('call', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h('test');
                        h('west');
                        h('rest');
                    }, 0);
                });

            p.debounce(20).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);

                setTimeout(function(){
                    assert.equal(spy.called, true);
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], 'rest');
                    
                    done();
                }, 40);
            }, 10)
        });

        it('call if E', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h(Latte.E('error'));
                    }, 0);
                });

            p.debounce(20).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);

                setTimeout(function(){
                    assert.equal(spy.called, true);
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'error');
                    
                    done();
                }, 40);
            }, 10);
        });

        it('not same instance', function(){
            var p1 = Latte.Stream(function(){}),
                p2 = p1.debounce(10);

            assert.equal(p1 === p2, false);
        });
    });

    describe('throttle', function(){

        it('call', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h('test');
                        h('west');
                        h('rest');
                    }, 0);
                });

            p.throttle(20).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);

                setTimeout(function(){
                    assert.equal(spy.called, true);
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], 'rest');

                    done();
                }, 40);
            }, 10)
        });

        it('call if E', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h(Latte.E('error'));
                    }, 0);
                });

            p.throttle(20).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);

                setTimeout(function(){
                    assert.equal(spy.called, true);
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'error');

                    done();
                }, 40);
            }, 10);
        });

        it('not same instance', function(){
            var p1 = Latte.Stream(function(){}),
                p2 = p1.throttle(10);

            assert.equal(p1 === p2, false);
        });
    });

    describe('combine', function(){

        it('call', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h('test-1');
                        h('test-11');
                    }, 0);
                });

            p.combine(Latte.Stream(function(h){
                h('test-2');
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-11","test-2"]');
                done();
            }, 40);
        });

        it('call with simple type argument', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test-1');
                });

            p.combine('test-2').always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-1","test-2"]');
                
                done();
            }, 40);
        });

        it('call handler only if all filled', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test-1');
                });

            p.combine(Latte.Stream(function(h){})).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 40);
        });

        it('call handler only if all filled 2', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){});

            p.combine(Latte.Stream(function(h){
                h('test-2');
            })).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 40);
        });

        it('call if E', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.E('error'));
                });

            p.combine(Latte.Stream(function(h){
                h('test-2');
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                
                done();
            }, 40);
        });

        it('call if E 2', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test-1');
                });

            p.combine(Latte.Stream(function(h){
                h(Latte.E('error'));
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                
                done();
            }, 40);
        });

        it('call if E 3', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.E('error-1'));
                });

            p.combine(Latte.Stream(function(h){
                h(Latte.E('error-2'));
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error-1');
                
                done();
            }, 40);
        });

        it('call if E 4', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.E('error-1'));
                });

            p.combine(Latte.E('error-2')).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error-1');
                
                done();
            }, 40);
        });

        it('call with empty array', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test-1');
                });

            p.combine([]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-1"]');
                
                done();
            }, 40);
        });

        it('call with not empty array', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test-1');
                });

            p.combine([
                Latte.Stream(function(h){
                    h('test-2');
                }),
                Latte.Stream(function(h){
                    setTimeout(function(){
                        h('test-3');
                        h('test-33');
                    }, 0);
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-1","test-2","test-33"]');
                done();
            }, 40);
        });

        it('not same instance', function(){
            var p1 = Latte.Stream(function(){}),
                p2 = p1.combine([]);

            assert.equal(p1 === p2, false);
        });
    });

    describe('any', function(){

        it('call if first fullfiled', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h('test-1');
                        h('test-2');
                    }, 0);
                });

            p.any(Latte.Stream(function(h){})).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-2");
                done();
            }, 40);
        });

        it('call with simple type argument', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test-1');
                });

            p.any('test-2').always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test-2');
                done();
            }, 40);
        });

        it('call if second fullfiled', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){});

            p.any(Latte.Stream(function(h){
                h('test-2');
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-2");
                
                done();
            }, 40);
        });

        it('call if both fullfiled', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h('test-1');
                    }, 0);
                });

            p.any(Latte.Stream(function(h){
                h('test-2');
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-1");
                done();
            }, 40);
        });

        it('call if first E', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.E('error'));
                });

            p.any(Latte.Stream(function(h){
                h('test-2');
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test-2');
                done();
            }, 40);
        });

        it('call if second E', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test-1');
                });

            p.any(Latte.Stream(function(h){
                h(Latte.E('error'));
            })).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('call if second E 2', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test-1');
                });

            p.any(Latte.E('error')).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('call with empty array', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test-1');
                });

            p.any([]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-1");
                
                done();
            }, 40);
        });

        it('call with not empty array', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test-1');
                });

            p.any([
                Latte.Stream(function(h){
                    h('test-2');
                }),
                Latte.Stream(function(h){
                    h('test-3');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-3");
                done();
            }, 40);
        });

        it('not same instance', function(){
            var p1 = Latte.Stream(function(){}),
                p2 = p1.any([]);

            assert.equal(p1 === p2, false);
        });
    });

    describe('gacc', function(){

        it('return', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.gacc(function*(v){
                return v;
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test");
                
                done();
            }, 40);
        });

        it('not call if E', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.E('error'));
                });

            p.gacc(function*(v){
                spy2();
                return v;
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, "error");
                assert.equal(spy2.called, false);
                
                done();
            }, 40);
        });

        it('accumulate', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    var i = 0,
                        iid = setInterval(function(){
                            h(++i);
                            i > 2 && clearInterval(iid);
                        }, 20);
                });

            p.gacc(function*(v){
                var result = [v];

                while(result.length < 3){
                    result.push(yield undefined);
                }

                return result;
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0].toString(), "1,2,3");
                
                done();
            }, 150);
        });

        it('call with context', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.gacc(function*(v){
                return this.prefix + v;
            }, {prefix : '!!'}).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "!!test");
                
                done();
            }, 40);
        });

        it('emulate generator', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h('test');
                });

            p.gacc(function(){
                return {
                    next : function(v){
                        return {done : true, value : v};
                    }
                };
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test");
                
                done();
            }, 40);
        });

        it('emulate generator 2', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    var i = 0,
                        iid = setInterval(function(){
                            h(++i);
                            i > 2 && clearInterval(iid);
                        }, 20);
                });

            p.gacc(function(){
                var result = [];

                return {
                    next : function(value){
                        result.push(value);
                        return {done : result.length >= 3, value : result};
                    }
                };
            }).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0].toString(), "1,2,3");
                
                done();
            }, 150);
        });

        it('not same instance', function(){
            var p1 = Latte.Stream(function(){}),
                p2 = p1.gacc(function*(){});

            assert.equal(p1 === p2, false);
        });
    });

    describe('log', function(){

        it('call', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h('test');
                        h('rest');
                    }, 0);
                });

            p.log().always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'rest');
                done();
            }, 40);
        });

        it('call if E', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    h(Latte.E('error'));
                });

            p.log().always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                
                done();
            }, 40);
        });

        it('same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.log();

            assert.equal(p1 === p2, true);
        });
    });
});

describe('Stream static', function(){

    describe('init', function(){

        it('set value', function(done){
            var spy = fspy(),
                p = Latte.Stream.init('test');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                
                done();
            }, 40);
        });

        it('set E', function(done){
            var spy = fspy(),
                p = Latte.Stream.init(Latte.E('error'));

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                
                done();
            }, 40);
        });

        it('set and unpack stream', function(done){
            var spy = fspy(),
                p = Latte.Stream.init(Latte.Stream.init('value'));

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'value');
                
                done();
            }, 40);
        });
    });

    describe('collectAll', function(){

        it('call', function(done){
            var spy = fspy();

            Latte.Stream.collectAll([
                Latte.Stream(function(h){
                    setTimeout(function(){
                        h('test-1');
                        h('test-11');
                    }, 0);
                }),
                Latte.Stream(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-11","test-2"]');
                done();
            }, 40);
        });

        it('call with simple value', function(done){
            var spy = fspy();

            Latte.Stream.collectAll([
                Latte.Stream(function(h){
                    setTimeout(function(){
                        h('test-1');
                        h('test-11');
                    }, 0);
                }),
                Latte.Stream(function(h){
                    h('test-2');
                }),
                'test-3'
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-11","test-2","test-3"]');
                done();
            }, 40);
        });

        it('call handler only if all filled', function(done){
            var spy = fspy();

            Latte.Stream.collectAll([
                Latte.Stream(function(h){
                    h('test-1');
                }),
                Latte.Stream(function(h){})
            ]).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 40);
        });

        it('call handler only if all filled 2', function(done){
            var spy = fspy();

            Latte.Stream.collectAll([
                Latte.Stream(function(h){}),
                Latte.Stream(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 40);
        });

        it('call if E', function(done){
            var spy = fspy();

            Latte.Stream.collectAll([
                Latte.Stream(function(h){
                    setTimeout(function(){
                        h(Latte.E('error-1'));
                        h(Latte.E('error-2'));
                    }, 0);
                }),
                Latte.Stream(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(Latte.isE(spy.args[0].value[0]), true);
                assert.equal(Latte.isE(spy.args[0].value[1]), false);

                assert.equal(spy.args[0].value[0].value, 'error-2');
                assert.equal(spy.args[0].value[1], 'test-2');

                done();
            }, 40);
        });

        it('call if E 2', function(done){
            var spy = fspy();

            Latte.Stream.collectAll([
                Latte.Stream(function(h){
                    h('test-1');
                }),
                Latte.Stream(function(h){
                    h(Latte.E('error'));
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(Latte.isE(spy.args[0].value[0]), false);
                assert.equal(Latte.isE(spy.args[0].value[1]), true);

                assert.equal(spy.args[0].value[0], 'test-1');
                assert.equal(spy.args[0].value[1].value, 'error');

                
                done();
            }, 40);
        });

        it('call with empty array', function(done){
            var spy = fspy();

            Latte.Stream.collectAll([]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '[]');
                
                done();
            }, 40);
        });
    });

    describe('collect', function(){

        it('call', function(done){
            var spy = fspy();

            Latte.Stream.collect([
                Latte.Stream(function(h){
                    setTimeout(function(){
                        h('test-1');
                        h('test-11');
                    }, 0);
                }),
                Latte.Stream(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-11","test-2"]');
                done();
            }, 40);
        });

        it('call with simple value', function(done){
            var spy = fspy();

            Latte.Stream.collect([
                Latte.Stream(function(h){
                    setTimeout(function(){
                        h('test-1');
                        h('test-11');
                    }, 0);
                }),
                Latte.Stream(function(h){
                    h('test-2');
                }),
                'test-3'
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-11","test-2","test-3"]');
                done();
            }, 40);
        });

        it('call handler only if all filled', function(done){
            var spy = fspy();

            Latte.Stream.collect([
                Latte.Stream(function(h){
                    h('test-1');
                }),
                Latte.Stream(function(h){})
            ]).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 40);
        });

        it('call handler only if all filled 2', function(done){
            var spy = fspy();

            Latte.Stream.collect([
                Latte.Stream(function(h){}),
                Latte.Stream(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 40);
        });

        it('call if E', function(done){
            var spy = fspy();

            Latte.Stream.collect([
                Latte.Stream(function(h){
                    setTimeout(function(){
                        h(Latte.E('error-1'));
                        h(Latte.E('error-2'));
                    }, 0);
                }),
                Latte.Stream(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error-2');
                done();
            }, 40);
        });

        it('call if E 2', function(done){
            var spy = fspy();

            Latte.Stream.collect([
                Latte.Stream(function(h){
                    h('test-1');
                }),
                Latte.Stream(function(h){
                    h(Latte.E('error'));
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                
                done();
            }, 40);
        });

        it('call if E 3', function(done){
            var spy = fspy();

            Latte.Stream.collect([
                Latte.Stream(function(h){
                    h(Latte.E('error-1'));
                }),
                Latte.Stream(function(h){
                    h(Latte.E('error-2'));
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error-1');
                
                done();
            }, 40);
        });

        it('call with empty array', function(done){
            var spy = fspy();

            Latte.Stream.collect([]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '[]');
                
                done();
            }, 40);
        });
    });

    describe('any', function(){

        it('call if first fullfiled', function(done){
            var spy = fspy();

            Latte.Stream.any([
                Latte.Stream(function(h){
                    setTimeout(function(){
                        h('test-1');
                        h('test-2');
                    }, 0);
                }),
                Latte.Stream(function(h){})
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-2");
                done();
            }, 40);
        });

        it('call if second fullfiled', function(done){
            var spy = fspy();

            Latte.Stream.any([
                Latte.Stream(function(h){}),
                Latte.Stream(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-2");
                
                done();
            }, 40);
        });

        it('call if both fullfiled', function(done){
            var spy = fspy();

            Latte.Stream.any([
                Latte.Stream(function(h){
                    h('test-1');
                }),
                Latte.Stream(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], "test-2");
                done();
            }, 40);
        });

        it('call if first E', function(done){
            var spy = fspy();

            Latte.Stream.any([
                Latte.Stream(function(h){
                    h(Latte.E('error'));
                }),
                Latte.Stream(function(h){
                    h('test-2');
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test-2');
                done();
            }, 40);
        });

        it('call if second E', function(done){
            var spy = fspy();

            Latte.Stream.any([
                Latte.Stream(function(h){
                    h('test-1');
                }),
                Latte.Stream(function(h){
                    h(Latte.E('error'));
                })
            ]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                done();
            }, 40);
        });

        it('call with empty array', function(done){
            var spy = fspy();

            Latte.Stream.any([]).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);
                done();
            }, 40);
        });
    });

    describe('fun', function(){

        it('call with one simple argument', function(done){
            var spy = fspy(),
                p = Latte.Stream.fun(function(a){
                    return a;
                })('test');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                
                done();
            }, 40);
        });

        it('call with context', function(done){
            var spy = fspy(),
                p = Latte.Stream.fun(function(a){
                    return this.prefix + a;
                }, {prefix : 'value-'})('test');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'value-test');
                
                done();
            }, 40);
        });

        it('call with several simple arguments', function(done){
            var spy = fspy(),
                p = Latte.Stream.fun(function(a, b, c){
                    return [a, b, c].toString();
                })('test', 'rest', 'west');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test,rest,west');
                
                done();
            }, 40);
        });

        it('call with E', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                p = Latte.Stream.fun(function(a){
                    spy2();
                    return a;
                })(Latte.E('error'));

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy2.called, false);
                assert.equal(spy.args[0].value, 'error');
                
                done();
            }, 40);
        });

        it('call with stream', function(done){
            var spy = fspy(),
                p = Latte.Stream.fun(function(a){
                    return a;
                })(Latte.Stream(function(h){
                    h('test');
                    setTimeout(function(){
                        h('rest');
                    }, 0)
                }));

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'rest');
                done();
            }, 40);
        });

        it('call with promise & stream', function(done){
            var spy = fspy(),
                p = Latte.Stream.fun(function(a, b){
                    return [a, b].toString();
                })(Latte.Stream(function(h){
                    h('west');
                    setTimeout(function(){
                        h('test');
                    }, 0)
                }), Latte.Promise(function(h){
                    h('rest');
                }));

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test,rest');
                done();
            }, 40);
        });

        it('call with complex arguments', function(done){
            var spy = fspy(),
                p = Latte.Stream.fun(function(a, b, c){
                    return Array.prototype.slice.call(arguments).toString();
                })(Latte.Stream(function(h){
                    h('west');
                    setTimeout(function(){
                        h('test');
                    }, 0)
                }), Latte.Promise(function(h){
                    h('rest');
                }), 'best');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test,rest,best');
                done();
            }, 40);
        });

        it('call with complex arguments with E', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                p = Latte.Stream.fun(function(a, b, c){
                    spy2();
                    return [a, b, c].toString();
                })(Latte.Promise(function(h){
                    setTimeout(function(){
                        h(Latte.E('error'));
                    }, 0)
                }), Latte.Stream(function(h){
                    h('rest');
                }), 'west');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                assert.equal(spy2.called, false);
                
                done();
            }, 40);
        });

        it('return E', function(done){
            var spy = fspy(),
                p = Latte.Stream.fun(function(a){
                    return Latte.E('error');
                })('test');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                
                done();
            }, 40);
        });

        it('return stream', function(done){
            var spy = fspy(),
                p = Latte.Stream.fun(function(a){
                    return Latte.Stream(function(h){
                        h(a);
                        setTimeout(function(){
                            h(a + '-1');
                        }, 0);
                    });
                })('test');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test-1');
                done();
            }, 40);
        });

        it('return stream with E', function(done){
            var spy = fspy(),
                p = Latte.Stream.fun(function(a){
                    return Latte.Stream(function(h){
                        h(Latte.E('error'));
                    });
                })('test');

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy.args[0].value, 'error');
                
                done();
            }, 40);
        });

        it('with callback', function(done){
            var spy = fspy(),
                p = Latte.Stream.fun(setTimeout)(Latte.callback(function(){
                    return 'test';
                }), 0);

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                
                done();
            }, 40);
        });

        it('with 2 callbacks', function(done){
            var spy = fspy(),
                p = Latte.Stream.fun(function(f, g){
                    g('test');
                    setTimeout(function(){
                        f('rest');
                    }, 0);
                })(Latte.callback(function(v){
                    return '[' + v + ']';
                }), Latte.callback(function(v){
                    return '(' + v + ')';
                }));

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], '[rest]');
                done();
            }, 40);
        });

        it('with callback ignore return', function(done){
            var spy = fspy(),
                p = Latte.Stream.fun(function(f){
                    f('test');
                    return 'rest';
                })(Latte.callback(function(){
                    return 'test';
                }));

            p.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                
                done();
            }, 40);
        });
    });

    describe('gen', function(){

        it('call', function(done){
            var spy = fspy(),
                g = Latte.Stream.gen(function*(){
                    return 'test';
                })();

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                
                done();
            }, 40);
        });

        it('call with context', function(done){
            var spy = fspy(),
                g = Latte.Stream.gen(function*(){
                    return this.value;
                }, {value : 'test'})();

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test');
                
                done();
            }, 40);
        });

        it('call with arguments', function(done){
            var spy = fspy(),
                g = Latte.Stream.gen(function*(){
                    return Array.prototype.slice.call(arguments).toString();
                })('test', 'rest');

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test,rest');
                
                done();
            }, 40);
        });

        it('call with stream as argument', function(done){
            var spy = fspy(),
                g = Latte.Stream.gen(function*(v){
                    return v;
                })(Latte.Stream(function(h){
                    h('test');
                    setTimeout(function(){
                        h('rest');
                    }, 0);
                }));

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'rest');
                done();
            }, 40);
        });

        it('not call if E', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                g = Latte.Stream.gen(function*(v){
                    spy2();
                    return v;
                })(Latte.E('error'));

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy2.called, false);
                assert.equal(spy.args[0].value, 'error');
                
                done();
            }, 40);
        });

        it('call with yield', function(done){
            var spy = fspy(),
                g = Latte.Stream.gen(function*(a){
                    var b = yield [a].concat('rest'),
                        c = yield Latte.Stream(function(h){
                            h(b.concat('west'));
                        });

                    return c.toString();
                })('test');

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'test,rest,west');
                
                done();
            }, 40);
        });

        it('E in generator', function(done){
            var spy = fspy(),
                spy2 = fspy(),
                g = Latte.Stream.gen(function*(a){
                    var b = yield Latte.E('error');
                    spy2();
                    var c = yield Latte.Stream(function(h){
                        h(b.concat('west'));
                    });

                    return c.toString();
                })('test');

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), true);
                assert.equal(spy2.called, false);
                assert.equal(spy.args[0].value, 'error');
                
                done();
            }, 40);
        });

        it('return stream', function(done){
            var spy = fspy(),
                g = Latte.Stream.gen(function*(a){
                    return Latte.Stream(function(h){
                        h('rest');
                    });
                })('test');

            g.always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(spy.args[0], 'rest');
                
                done();
            }, 40);
        });
    });
});

describe('Stream shell', function(){

    it('without value', function(done){
        var spy = fspy(),
            s = Latte.Stream.shell();

        s.out().always(spy);

        setTimeout(function(){
            assert.equal(spy.called, false);
            done();
        }, 40);
    });

    it('out method return same instance', function(){
        var spy = fspy(),
            s = Latte.Stream.shell();

        assert.equal(s.out() === s.out(), true);
    });

    it('set value', function(done){
        var spy = fspy(),
            s = Latte.Stream.shell();

        s.out().always(spy);
        s.set('test');

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test');
            
            done();
        }, 40);
    });

    it('set promise', function(done){
        var spy = fspy(),
            s = Latte.Stream.shell();

        s.out().always(spy);
        s.set(Latte.Promise(function(h){
            h('test');
        }));

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test');
            
            done();
        }, 40);
    });

    it('set promise', function(done){
        var spy = fspy(),
            s = Latte.Stream.shell();

        s.out().always(spy);
        s.set(Latte.Stream(function(h){
            h('test');
        }));

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test');
            
            done();
        }, 40);
    });

    it('set value twice', function(done){
        var spy = fspy(),
            s = Latte.Stream.shell();

        s.out().always(spy);
        s.set('test-1').set('test-2');

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test-2');
            done();
        }, 40);
    });

    it('out method return common promise instance', function(){
        var s = Latte.Stream.shell(),
            out = s.out();

        assert.equal(typeof out.set === 'undefined', true);
        assert.equal(typeof out.out === 'undefined', true);
    });
});

describe('extend', function(){

    it('extend Promise', function(){
        var EPromise = Latte.extend(Latte.Promise),
            ext = EPromise(function(){});

        assert.equal(Latte.isLatte(ext), true);
        assert.equal(Latte.isPromise(ext), true);
        assert.equal(Latte.isStream(ext), false);
    });

    it('extend Stream', function(){
        var EStream = Latte.extend(Latte.Stream),
            ext = EStream(function(){});

        assert.equal(Latte.isLatte(ext), true);
        assert.equal(Latte.isPromise(ext), false);
        assert.equal(Latte.isStream(ext), true);
    });

    it('add new method', function(){
        var EPromise = Latte.extend(Latte.Promise, {
                test : function(){
                    return 'test';
                }
            }),
            ext = EPromise(function(){});

        assert.equal(ext.test(), 'test');
    });

    it('check static methods', function(){
        var EPromise = Latte.extend(Latte.Promise, {
                test : function(){
                    return 'test';
                }
            });

        assert.equal(typeof EPromise.collectAll === 'function', true);
        assert.equal(typeof EPromise.collect === 'function', true);
        assert.equal(typeof EPromise.any === 'function', true);
        assert.equal(typeof EPromise.shell === 'function', true);
    });

});
