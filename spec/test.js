/**
 * Autor: Evstigneev Andrey
 * Date: 06.12.13
 * Time: 0:05
 */

(function(){

    'use strict';

    var stub = function(ret){
        var fn = function(){

            fn.called = true;
            fn.count += 1;
            fn.args = arguments;

            return typeof ret === 'function' ? ret({
                args : arguments,
                context : this,
                self : fn
            }) : ret;
        };

        fn.called = false;
        fn.count = 0;
        fn.args = null;

        fn.reset = function(){
            fn.called = false;
            fn.count = 0;
            fn.args = null;
        };

        return fn;
    };

    TestCase('test', {

        testPromiseArgs : function(){
            var st = stub();
            latte.Promise(st);

            assert(typeof st.args[0] === 'function');
            assert(typeof st.args[1] === 'function');
        },

        testPromiseResolve : function(){
            var st = stub(),
                h;

            latte.Promise(function(resolver){
                h = resolver;
            })(st);

            h(123);
            assertEquals(st.args[0], 123);
        },

        testPromiseReject : function(){
            var st = stub(),
                h;

            latte.Promise(function(resolver, rejector){
                h = rejector;
            })(null, st);

            h(123);
            assertEquals(st.args[0], 123);
        },

        testPromiseResolveChain : function(){
            var st1 = stub(),
                st2 = stub(),
                h;

            latte.Promise(function(resolver, rejector){
                h = resolver;
            })(st1)(st2);

            h(123);
            assertEquals(st1.args[0], 123);
            assertEquals(st2.args[0], 123);
        },

        testPromiseRejectChain : function(){
            var st1 = stub(),
                st2 = stub(),
                h;

            latte.Promise(function(resolver, rejector){
                h = rejector;
            })(null, st1)(null, st2);

            h(123);
            assertEquals(st1.args[0], 123);
            assertEquals(st2.args[0], 123);
        },

        testTransmitResolve : function(){
            var st1 = stub(),
                st2 = stub(),
                h;

            latte.Promise(function(resolver, rejector){
                h = resolver;
            })(latte.unit)(st1)(st2);

            h(123);
            assertEquals(st1.args[0], 123);
            assertEquals(st2.args[0], 123);
        },

        testNullPromiseResolveContinuator : function(){
            var st1 = stub(),
                st2 = stub(),
                h;

            latte.Promise(function(resolver, rejector){
                h = resolver;
            })()()(st1)(st2);

            h(123);
            assertEquals(st1.args[0], 123);
            assertEquals(st2.args[0], 123);
        },

        testNullPromiseRejectContinuator : function(){
            var st1 = stub(),
                st2 = stub(),
                h;

            latte.Promise(function(resolver, rejector){
                h = rejector;
            })()()(null, st1)(null, st2);

            h(123);
            assertEquals(st1.args[0], 123);
            assertEquals(st2.args[0], 123);
        },

        testPromiseRedefineResolve : function(){
            var st1 = stub(),
                st2 = stub(),
                h;

            latte.Promise(function(resolver, rejector){
                h = resolver;
            })(st1)(function(val){
                return latte.Promise(function(resolver){
                    resolver(val + 5);
                });
            })(st2);

            h(123);
            assertEquals(st1.args[0], 123);
            assertEquals(st2.args[0], 128);
        },

        testPromiseRedefineResolveUnit : function(){
            var st1 = stub(),
                st2 = stub(),
                h;

            latte.Promise(function(resolver, rejector){
                h = resolver;
            })(st1)(function(val){
                return latte.unit(val + 5);
            })(st2);

            h(123);
            assertEquals(st1.args[0], 123);
            assertEquals(st2.args[0], 128);
        },

        testPromiseRedefineReject : function(){
            var st1 = stub(),
                st2 = stub(),
                h;

            latte.Promise(function(resolver, rejector){
                h = rejector;
            })(null, st1)(null, function(val){
                return latte.Promise(function(resolver, rejector){
                    rejector(val + 5);
                });
            })(null, st2);

            h(123);
            assertEquals(st1.args[0], 123);
            assertEquals(st2.args[0], 128);
        },

        testPromiseRedefineRejectUnit : function(){
            var st1 = stub(),
                st2 = stub(),
                h;

            latte.Promise(function(resolver, rejector){
                h = rejector;
            })(null, st1)(null, function(val){
                return latte.fail(val + 5);
            })(null, st2);

            h(123);
            assertEquals(st1.args[0], 123);
            assertEquals(st2.args[0], 128);
        },

        testPromiseRedefineFromResolveToReject : function(){
            var st1 = stub(),
                st2 = stub(),
                h;

            latte.Promise(function(resolver, rejector){
                h = resolver;
            })(st1)(function(val){
                return latte.Promise(function(resolver, rejector){
                    rejector(val + 5);
                });
            })(null, st2);

            h(123);
            assertEquals(st1.args[0], 123);
            assertEquals(st2.args[0], 128);
        },

        testPromiseRedefineFromRejectToResolve : function(){
            var st1 = stub(),
                st2 = stub(),
                h;

            latte.Promise(function(resolver, rejector){
                h = rejector;
            })(null, st1)(null, function(val){
                return latte.Promise(function(resolver, rejector){
                    resolver(val + 5);
                });
            })(st2);

            h(123);
            assertEquals(st1.args[0], 123);
            assertEquals(st2.args[0], 128);
        },

        testWrapAsResolved : function(){
            var st1 = stub(),
                st2 = stub();

            latte.unit(5)(st1, st2);
            assertEquals(st1.args[0], 5);
            assertEquals(st2.called, false);
        },

        testWrapAsRejected : function(){
            var st1 = stub(),
                st2 = stub();

            latte.fail(5)(st1, st2);
            assertEquals(st1.called, false);
            assertEquals(st2.args[0], 5);
        },

        testWrapFunctionAsResolved : function(){
            var st1 = stub(),
                st2 = stub();

            latte.unit(function(){return 5;})(st1, st2);
            assertEquals(st1.args[0](), 5);
            assertEquals(st2.called, false);
        },

        testLiftResolve : function(){
            var st1 = stub(),
                st2 = stub();

            latte.lift(function(val){
                return val + 5;
            })(latte.unit(3))(st1, st2);

            assertEquals(st1.args[0], 8);
            assertEquals(st2.called, false);
        },

        testLiftReject : function(){
            var st1 = stub(),
                st2 = stub();

            latte.lift(null, function(val){
                return val + 5;
            })(latte.fail(3))(st1, st2);

            assertEquals(st1.called, false);
            assertEquals(st2.args[0], 8);
        },

        testCollectEmpty : function(){
            var st1 = stub(),
                st2 = stub();

            latte.collect([])(st1, st2);

            assertEquals(st1.args[0], []);
            assertEquals(st2.called, false);
        },

        testCollectAllResolved : function(){
            var st1 = stub(),
                st2 = stub(),
                h;

            latte.collect([
                latte.Promise(function(resolve){
                    h = resolve;
                }),
                latte.unit(2),
                latte.unit(3)
            ])(st1, st2);

            h(1);

            assertEquals(st1.args[0], [1,2,3]);
            assertEquals(st2.called, false);
        },

        testCollectOneRejected : function(){
            var st1 = stub(),
                st2 = stub(),
                h;

            latte.collect([
                latte.unit(1),
                latte.Promise(function(resolve, reject){
                    h = reject;
                }),
                latte.unit(3)
            ])(st1, st2);

            h('error');

            assertEquals(st1.called, false);
            assertEquals(st2.args[0], 'error');
        },

        testWpipe : function(){
            var st1 = stub(),
                st2 = stub(),
                p1 = function(){
                    return latte.unit(1);
                },
                p2 = function(v){
                    return latte.Promise(function(resolve){
                        setTimeout(function(){
                            resolve(v + 2);
                        }, 0);
                    });
                },
                p3 = function(v){
                    return latte.unit(v + 3);
                };

            latte.wpipe([p1, p2, p3])(st1, st2);

            setTimeout(function(){
                assertEquals(st1.args[0], 6);
                assertEquals(st2.called, false);
            }, 1);
        },

        testWpipeWithInitValue : function(){
            var st1 = stub(),
                st2 = stub(),
                p1 = function(){
                    return latte.unit(1);
                },
                p2 = function(v){
                    return latte.Promise(function(resolve){
                        setTimeout(function(){
                            resolve(v + 2);
                        }, 0);
                    });
                },
                p3 = function(v){
                    return latte.unit(v + 3);
                };

            latte.wpipe([p1, p2, p3], 10)(st1, st2);

            setTimeout(function(){
                assertEquals(st1.args[0], 16);
                assertEquals(st2.called, false);
            }, 1);
        },

        testWpipeReject : function(){
            var st1 = stub(),
                st2 = stub(),
                p1 = function(){
                    return latte.unit(1);
                },
                p2 = function(v){
                    return latte.Promise(function(resolve){
                        setTimeout(function(){
                            resolve(v + 2);
                        }, 0);
                    });
                },
                p3 = function(v){
                    return latte.fail('error');
                };

            latte.wpipe([p1, p2, p3])(st1, st2);

            setTimeout(function(){
                assertEquals(st1.called, false);
                assertEquals(st2.args[0], 'error');
            }, 1);
        },

        testLiftWithFilter : function(){
            var st1 = stub(),
                st2 = stub();

            latte.lift(function(list){
                return list.filter(function(v){
                    return v > 2;
                });
            })(latte.collect([
                latte.unit(1),
                latte.unit(2),
                latte.unit(3)
            ]))(st1, st2);

            assertEquals(st1.args[0], [3]);
            assertEquals(st2.called, false);
        },

        testLiftWithFilterReject : function(){
            var st1 = stub(),
                st2 = stub();

            latte.lift(function(list){
                return list.filter(function(v){
                    return v > 2;
                });
            })(latte.collect([
                latte.unit(1),
                latte.fail('error'),
                latte.unit(3)
            ]))(st1, st2);

            assertEquals(st1.called, false);
            assertEquals(st2.args[0], 'error');
        },

        testLiftWithMap : function(){
            var st1 = stub(),
                st2 = stub();

            latte.lift(function(list){
                return list.map(function(v){
                    return v + 2;
                });
            })(latte.collect([
                latte.unit(1),
                latte.unit(2),
                latte.unit(3)
            ]))(st1, st2);

            assertEquals(st1.args[0], [3,4,5]);
            assertEquals(st2.called, false);
        },

        testLiftWithMapRejected : function(){
            var st1 = stub(),
                st2 = stub();

            latte.lift(function(list){
                return list.map(function(v){
                    return v + 2;
                });
            })(latte.collect([
                latte.unit(1),
                latte.fail('error'),
                latte.unit(3)
            ]))(st1, st2);

            assertEquals(st1.called, false);
            assertEquals(st2.args[0], 'error');
        },

        testLiftReduce : function(){
            var st1 = stub(),
                st2 = stub();

            latte.lift(function(list){
                return list.reduce(function(acc, v){
                    return acc += v;
                }, 0);
            })(latte.collect([
                latte.unit(1),
                latte.unit(2),
                latte.unit(3)
            ]))(st1, st2);

            assertEquals(st1.args[0], 6);
            assertEquals(st2.called, false);
        },

        testLiftReduceRejected : function(){
            var st1 = stub(),
                st2 = stub();

            latte.lift(function(list){
                return list.reduce(function(acc, v){
                    return acc += v;
                }, 0);
            })(latte.collect([
                latte.unit(1),
                latte.fail('error'),
                latte.unit(3)
            ]))(st1, st2);

            assertEquals(st1.called, false);
            assertEquals(st2.args[0], 'error');
        },

        testMonadicLawsLeftIdentity : function(){
            var st1 = stub(),
                st2 = stub(),

                f = function(a){
                    return latte.unit(a + 1);
                },
                l,
                r;

            l = latte.unit(2)(f);
            r = f(2);

            l(st1);
            r(st2);

            assert(st1.args[0] === st2.args[0]);
            assert(st1.args[0] === 3);
        },

        testMonadicLawsLeftIdentityPromise : function(){
            var st1 = stub(),
                st2 = stub(),

                f = function(a){
                    return latte.unit(a);
                },
                l,
                r;

            l = latte.Promise(function(resolve){
                resolve(2);
            })(f);
            r = f(2);

            l(st1);
            r(st2);

            assert(st1.args[0] === st2.args[0]);
            assert(st1.args[0] === 2);
        },

        testMonadicLawsLeftIdentityReject : function(){
            var st1 = stub(),
                st2 = stub(),

                f = function(a){
                    return latte.fail(a);
                },
                l,
                r;

            l = latte.Promise(function(resolve, reject){
                reject(2);
            })(null, f);
            r = f(2);

            l(null, st1);
            r(null, st2);

            assert(st1.args[0] === st2.args[0]);
            assert(st1.args[0] === 2);
        },

        testMonadicLawsRightIdentity : function(){
            var st1 = stub(),
                st2 = stub(),
                l,
                r;

            l = latte.unit(2)(latte.unit);
            r = latte.unit(2);

            l(st1);
            r(st2);

            assert(st1.args[0] === st2.args[0]);
            assert(st1.args[0] === 2);
        },

        testMonadicLawsRightIdentityPromise : function(){
            var st1 = stub(),
                st2 = stub(),
                l,
                r;

            l = latte.Promise(function(resolve){
                resolve(2);
            })(latte.unit);
            r = latte.unit(2);

            l(st1);
            r(st2);

            assert(st1.args[0] === st2.args[0]);
            assert(st1.args[0] === 2);
        },

        testMonadicLawsRightIdentityReject : function(){
            var st1 = stub(),
                st2 = stub(),
                l,
                r;

            l = latte.Promise(function(resolve, reject){
                reject(2);
            })(null, latte.fail);
            r = latte.fail(2);

            l(null, st1);
            r(null, st2);

            assert(st1.args[0] === st2.args[0]);
            assert(st1.args[0] === 2);
        },

        testMonadicLawsAssociativity : function(){
            var st1 = stub(),
                st2 = stub(),

                f = function(a){
                    return latte.unit(a + 3);
                },

                g = function(a){
                    return latte.unit(a - 1);
                },

                l,
                r;

            l = latte.unit(2)(f)(g);
            r = latte.unit(2)(function(a){
                return f(a)(g);
            });

            l(st1);
            r(st2);

            assert(st1.args[0] === st2.args[0]);
            assert(st1.args[0] === 4);
        },

        testMonadicLawsAssociativityPromise : function(){
            var st1 = stub(),
                st2 = stub(),

                f = function(a){
                    return latte.unit(a + 3);
                },

                g = function(a){
                    return latte.unit(a - 1);
                },

                l,
                r;

            l = latte.Promise(function(resolve){
                resolve(2);
            })(f)(g);
            r = latte.unit(2)(function(a){
                return f(a)(g);
            });

            l(st1);
            r(st2);

            assert(st1.args[0] === st2.args[0]);
            assert(st1.args[0] === 4);
        },

        testMonadicLawsAssociativityReject : function(){
            var st1 = stub(),
                st2 = stub(),

                f = function(a){
                    return latte.fail(a + 3);
                },

                g = function(a){
                    return latte.fail(a - 1);
                },

                l,
                r;

            l = latte.Promise(function(resolve, reject){
                reject(2);
            })(null, f)(null, g);
            r = latte.fail(2)(null, function(a){
                return f(a)(null, g);
            });

            l(null, st1);
            r(null, st2);

            assert(st1.args[0] === st2.args[0]);
            assert(st1.args[0] === 4);
        }
    });
}());