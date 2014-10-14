/**
 * Autor: Evstigneev Andrey
 * Date: 01.10.2014
 * Time: 21:40
 */

var assert = require("assert"),
    Latte = require("../latte.js"),
    fspy = require("./fspy.js");

describe('Nothing', function(){

    it('isNothing', function(){
        assert.equal(Latte.isNothing(Latte._NOTHING), true);
        assert.equal(Latte.isNothing(), false);
        assert.equal(Latte.isNothing('Nothing'), false);
    });

});

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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy1.args[1]), true);
                    assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy1.args[1]), true);
                    assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
                done();
            }, 50);
        });

        it('not same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.pass();

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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy1.args[1]), true);
                    assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy1.args[1]), true);
                    assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy1.args[1]), true);
                    assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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

    describe('wait', function(){

        it('call', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h('test');
                });

            p.wait(20).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);

                setTimeout(function(){
                    assert.equal(spy.called, true);
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], 'test');
                    assert.equal(Latte.isNothing(spy.args[1]), true);
                    done();
                }, 40);
            }, 10)
        });

        it('call if E', function(done){
            var spy = fspy(),
                p = Latte.Promise(function(h){
                    h(Latte.E('error'));
                });

            p.wait(20).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);

                setTimeout(function(){
                    assert.equal(spy.called, true);
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'error');
                    assert.equal(Latte.isNothing(spy.args[1]), true);
                    done();
                }, 40);
            }, 10)
        });

        it('not same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.wait(10);

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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
                done();
            }, 40);
        });

        it('not same instance', function(){
            var p1 = Latte.Promise(function(){}),
                p2 = p1.any([]);

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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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

                assert.equal(Latte.isNothing(spy.args[1]), true);
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

                assert.equal(Latte.isNothing(spy.args[1]), true);
                done();
            }, 40);
        });

        it('call with empty array', function(done){
            var spy = fspy();

            Latte.Promise.collectAll([]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '[]');
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
                done();
            }, 40);
        });

        it('call with empty array', function(done){
            var spy = fspy();

            Latte.Promise.collect([]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '[]');
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
});

describe('Promise Shell', function(){

    it('without value', function(done){
        var spy = fspy(),
            s = Latte.Promise.Shell();

        s.out().always(spy);

        setTimeout(function(){
            assert.equal(spy.called, false);
            done();
        }, 40);
    });

    it('out method return same instance', function(){
        var spy = fspy(),
            s = Latte.Promise.Shell();

        assert.equal(s.out() === s.out(), true);
    });

    it('set value', function(done){
        var spy = fspy(),
            s = Latte.Promise.Shell();

        s.out().always(spy);
        s.set('test');

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('ignore set value twice', function(done){
        var spy = fspy(),
            s = Latte.Promise.Shell();

        s.out().always(spy);
        s.set('test-1').set('test-2');

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test-1');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('get method', function(done){
        var spy = fspy(),
            s = Latte.Promise.Shell();

        s.set('test').out().always(spy);

        setTimeout(function(){
            var val = s.get();
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(Latte.isE(val), false);
            assert.equal(spy.args[0], 'test');
            assert.equal(val, 'test');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('out method return common promise instance', function(){
        var s = Latte.Promise.Shell(),
            out = s.out();

        assert.equal(typeof out.set === 'undefined', true);
        assert.equal(typeof out.get === 'undefined', true);
        assert.equal(typeof out.out === 'undefined', true);
    });
});

describe('Promise Gen', function(){

    it('simple return', function(done){
        var spy = fspy(),
            p = Latte.Promise.Gen(function*(v){
                return v;
            }).set('test').out();

        p.always(spy);

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('not call generator if E', function(done){
        var spy1 = fspy(),
            spy2 = fspy(),
            p = Latte.Promise.Gen(function*(v){
                spy2();
                return v;
            }).set(Latte.E('error')).out();

        p.always(spy1);

        setTimeout(function(){
            assert.equal(Latte.isE(spy1.args[0]), true);
            assert.equal(spy2.called, false);
            assert.equal(spy1.args[0].value, 'error');
            assert.equal(Latte.isNothing(spy1.args[1]), true);
            done();
        }, 40);
    });

    it('set twice', function(done){
        var spy = fspy(),
            p = Latte.Promise.Gen(function*(v){
                return v;
            }).set('test').set('rest').out();

        p.always(spy);

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('yield', function(done){
        var spy = fspy(),
            p = Latte.Promise.Gen(function*(v){
                var v2 = yield '-1';
                return v + v2;
            }).set('test').out();

        p.always(spy);

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test-1');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('yield & inner promises', function(done){
        var spy = fspy(),
            p = Latte.Promise.Gen(function*(v){
                var r1 = yield Latte.Promise(function(h){
                        setTimeout(function(){
                            h('(' + v + ')');
                        }, 0);
                    }),

                    r2 = yield Latte.Promise(function(h){
                        setTimeout(function(){
                            h('[' + r1 + ']');
                        }, 0);
                    });

                return r2;
            }).set('test').out();

        p.always(spy);

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], '[(test)]');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('return promises', function(done){
        var spy = fspy(),
            p = Latte.Promise.Gen(function*(v){
                var r1 = yield Latte.Promise(function(h){
                        setTimeout(function(){
                            h('(' + v + ')');
                        }, 0);
                    }),

                    r2 = yield Latte.Promise(function(h){
                        setTimeout(function(){
                            h('[' + r1 + ']');
                        }, 0);
                    });

                return Latte.Promise(function(h){
                    h('{' + r2 + '}');
                });
            }).set('test').out();

        p.always(spy);

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], '{[(test)]}');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('get method', function(done){
        var spy = fspy(),
            p = Latte.Promise.Gen(function*(v){
                return yield Latte.Promise(function(h){
                    setTimeout(function(){
                        h('(' + v + ')');
                    }, 0);
                });
            }).set('test');

        p.out().always(spy);

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], '(test)');
            assert.equal(p.get(), 'test');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('out method return common promise instance', function(){
        var s = Latte.Promise.Gen(function*(){}),
            out = s.out();

        assert.equal(typeof out.set === 'undefined', true);
        assert.equal(typeof out.get === 'undefined', true);
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
                p1 = new Latte.Stream(function(h){
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
                assert.equal(spy.args[1], 'test');
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
                assert.equal(spy.args[1], 'test');
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
                assert.equal(spy.args[1], 'test');
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(spy.args[1], 'west');
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
                assert.equal(Latte.isE(spy.args[1]), false);
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isE(spy.args[1]), false);
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(spy.args[1], 2);
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
                assert.equal(spy.args[1], 2);
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
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(spy1.args[1], 5);
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
                assert.equal(spy.args[1], 2);
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
                assert.equal(spy.args[1], -2);
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
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(spy.args[1], '(test)');
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
                    assert.equal(Latte.isE(spy.args[1]), true);
                    assert.equal(spy.args[1].value, 'error');
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
                    assert.equal(spy2.args[1].value, 'error-1');
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
                    assert.equal(spy.args[1].value, 'error');
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
                    assert.equal(Latte.isNothing(spy1.args[1]), true);
                    assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isE(spy.args[1]), false);
                    assert.equal(spy.args[0], '(rest)');
                    assert.equal(spy.args[1], '(test)');
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
                    assert.equal(Latte.isE(spy.args[1]), true);
                    assert.equal(spy.args[1].value, 'error');
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy1.args[1]), true);
                    assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(Latte.isE(spy.args[1]), false);
                    assert.equal(spy.args[0], '({test})');
                    assert.equal(spy.args[1], '([test])');
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
                    assert.equal(Latte.isE(spy.args[1]), false);
                    assert.equal(spy.args[0], '{[test]}');
                    assert.equal(spy.args[1], '([test])');
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy1.args[1]), true);
                assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                assert.equal(Latte.isE(spy.args[1]), false);
                assert.equal(spy.args[1], 'west');
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
                done();
            }, 50);
        });

        it('not same instance', function(){
            var p1 = Latte.Stream(function(){}),
                p2 = p1.pass();

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
                    assert.equal(spy.args[1], 'test');
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy1.args[1]), true);
                    assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isE(spy.args[1]), true);
                    assert.equal(spy.args[0].value, 'new error-2');
                    assert.equal(spy.args[1].value, 'new error-1');
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(spy1.args[1], '{error}');
                    assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy1.args[1]), true);
                    assert.equal(Latte.isNothing(spy2.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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

    describe('wait', function(){

        it('call', function(done){
            var spy = fspy(),
                p = Latte.Stream(function(h){
                    setTimeout(function(){
                        h('test');
                        h('west');
                        h('rest');
                    }, 0);
                });

            p.wait(20).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);

                setTimeout(function(){
                    assert.equal(spy.called, true);
                    assert.equal(Latte.isE(spy.args[0]), false);
                    assert.equal(spy.args[0], 'rest');
                    assert.equal(Latte.isNothing(spy.args[1]), true);
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

            p.wait(20).always(spy);

            setTimeout(function(){
                assert.equal(spy.called, false);

                setTimeout(function(){
                    assert.equal(spy.called, true);
                    assert.equal(Latte.isE(spy.args[0]), true);
                    assert.equal(spy.args[0].value, 'error');
                    assert.equal(Latte.isNothing(spy.args[1]), true);
                    done();
                }, 40);
            }, 10);
        });

        it('not same instance', function(){
            var p1 = Latte.Stream(function(){}),
                p2 = p1.wait(10);

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
                assert.equal(JSON.stringify(spy.args[1]), '["test-1","test-2"]');
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(JSON.stringify(spy.args[1]), '["test-1","test-2","test-3"]');
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
                assert.equal(spy.args[1], "test-1");
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(spy.args[1], "test-2");
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
                assert.equal(Latte.isE(spy.args[1]), true);
                assert.equal(spy.args[0], 'test-2');
                assert.equal(spy.args[1].value, 'error');
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
                assert.equal(Latte.isE(spy.args[1]), false);
                assert.equal(spy.args[0].value, 'error');
                assert.equal(spy.args[1], 'test-1');
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(spy.args[1], "test-2");
                done();
            }, 40);
        });

        it('not same instance', function(){
            var p1 = Latte.Stream(function(){}),
                p2 = p1.any([]);

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
                assert.equal(spy.args[1], 'test');
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isE(spy.args[1]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-11","test-2"]');
                assert.equal(JSON.stringify(spy.args[1]), '["test-1","test-2"]');
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

                assert.equal(spy.args[1].value[0].value, 'error-1');
                assert.equal(spy.args[1].value[1], 'test-2');
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

                assert.equal(Latte.isNothing(spy.args[1]), true);
                done();
            }, 40);
        });

        it('call with empty array', function(done){
            var spy = fspy();

            Latte.Stream.collectAll([]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '[]');
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isE(spy.args[1]), false);
                assert.equal(JSON.stringify(spy.args[0]), '["test-11","test-2"]');
                assert.equal(JSON.stringify(spy.args[1]), '["test-1","test-2"]');
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
                assert.equal(Latte.isE(spy.args[1]), true);
                assert.equal(spy.args[0].value, 'error-2');
                assert.equal(spy.args[1].value, 'error-1');
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
                done();
            }, 40);
        });

        it('call with empty array', function(done){
            var spy = fspy();

            Latte.Stream.collect([]).always(spy);

            setTimeout(function(){
                assert.equal(Latte.isE(spy.args[0]), false);
                assert.equal(JSON.stringify(spy.args[0]), '[]');
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isE(spy.args[1]), false);
                assert.equal(spy.args[0], "test-2");
                assert.equal(spy.args[1], "test-1");
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
                assert.equal(Latte.isNothing(spy.args[1]), true);
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
                assert.equal(Latte.isE(spy.args[1]), false);
                assert.equal(spy.args[0], "test-2");
                assert.equal(spy.args[1], "test-1");
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
                assert.equal(Latte.isE(spy.args[1]), true);
                assert.equal(spy.args[0], 'test-2');
                assert.equal(spy.args[1].value, 'error');
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
                assert.equal(Latte.isE(spy.args[1]), false);
                assert.equal(spy.args[0].value, 'error');
                assert.equal(spy.args[1], 'test-1');
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
});

describe('Stream Shell', function(){

    it('without value', function(done){
        var spy = fspy(),
            s = Latte.Stream.Shell();

        s.out().always(spy);

        setTimeout(function(){
            assert.equal(spy.called, false);
            done();
        }, 40);
    });

    it('out method return same instance', function(){
        var spy = fspy(),
            s = Latte.Stream.Shell();

        assert.equal(s.out() === s.out(), true);
    });

    it('set value', function(done){
        var spy = fspy(),
            s = Latte.Stream.Shell();

        s.out().always(spy);
        s.set('test');

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('set value twice', function(done){
        var spy = fspy(),
            s = Latte.Stream.Shell();

        s.out().always(spy);
        s.set('test-1').set('test-2');

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(Latte.isE(spy.args[1]), false);
            assert.equal(spy.args[0], 'test-2');
            assert.equal(spy.args[1], 'test-1');
            done();
        }, 40);
    });

    it('get method', function(done){
        var spy = fspy(),
            s = Latte.Stream.Shell();

        s.set('test').out().always(spy);

        setTimeout(function(){
            var val = s.get();
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(Latte.isE(val), false);
            assert.equal(spy.args[0], 'test');
            assert.equal(val, 'test');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('out method return common promise instance', function(){
        var s = Latte.Stream.Shell(),
            out = s.out();

        assert.equal(typeof out.set === 'undefined', true);
        assert.equal(typeof out.get === 'undefined', true);
        assert.equal(typeof out.out === 'undefined', true);
    });
});

describe('Stream Gen', function(){

    it('simple return', function(done){
        var spy = fspy(),
            p = Latte.Stream.Gen(function*(v){
                return v;
            }).set('test').out();

        p.always(spy);

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('not call generator if E', function(done){
        var spy1 = fspy(),
            spy2 = fspy(),
            p = Latte.Stream.Gen(function*(v){
                spy2();
                return v;
            }).set(Latte.E('error')).out();

        p.always(spy1);

        setTimeout(function(){
            assert.equal(Latte.isE(spy1.args[0]), true);
            assert.equal(spy2.called, false);
            assert.equal(spy1.args[0].value, 'error');
            assert.equal(Latte.isNothing(spy1.args[1]), true);
            done();
        }, 40);
    });

    it('set twice', function(done){
        var spy = fspy(),
            p = Latte.Stream.Gen(function*(v){
                return v;
            }).set('test').set('rest').out();

        p.always(spy);

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'rest');
            assert.equal(spy.args[1], 'test');
            done();
        }, 40);
    });

    it('yield', function(done){
        var spy = fspy(),
            p = Latte.Stream.Gen(function*(v){
                var v2 = yield '-1';
                return v + v2;
            }).set('test').out();

        p.always(spy);

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], 'test-1');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('yield & inner streams', function(done){
        var spy = fspy(),
            p = Latte.Stream.Gen(function*(v){
                var r1 = yield Latte.Stream(function(h){
                        setTimeout(function(){
                            h('(' + v + ')');
                        }, 0);
                    }),

                    r2 = yield Latte.Stream(function(h){
                        setTimeout(function(){
                            h('[' + r1 + ']');
                        }, 0);
                    });

                return r2;
            }).set('test').out();

        p.always(spy);

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], '[(test)]');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('return stream', function(done){
        var spy = fspy(),
            p = Latte.Stream.Gen(function*(v){
                var r1 = yield Latte.Stream(function(h){
                        setTimeout(function(){
                            h('(' + v + ')');
                        }, 0);
                    }),

                    r2 = yield Latte.Stream(function(h){
                        setTimeout(function(){
                            h('[' + r1 + ']');
                        }, 0);
                    });

                return Latte.Stream(function(h){
                    h('{' + r2 + '}');
                });
            }).set('test').out();

        p.always(spy);

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], '{[(test)]}');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('get method', function(done){
        var spy = fspy(),
            p = Latte.Stream.Gen(function*(v){
                return yield Latte.Stream(function(h){
                    setTimeout(function(){
                        h('(' + v + ')');
                    }, 0);
                });
            }).set('test');

        p.out().always(spy);

        setTimeout(function(){
            assert.equal(Latte.isE(spy.args[0]), false);
            assert.equal(spy.args[0], '(test)');
            assert.equal(p.get(), 'test');
            assert.equal(Latte.isNothing(spy.args[1]), true);
            done();
        }, 40);
    });

    it('out method return common promise instance', function(){
        var s = Latte.Stream.Gen(function*(){}),
            out = s.out();

        assert.equal(typeof out.set === 'undefined', true);
        assert.equal(typeof out.get === 'undefined', true);
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

});
