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
            })(latte.wrap)(st1)(st2);

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
                return latte.wrap(val + 5);
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
                return latte.wrap(val + 5, true);
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

            latte.wrap(5)(st1, st2);
            assertEquals(st1.args[0], 5);
            assertEquals(st2.called, false);
        },

        testWrapAsRejected : function(){
            var st1 = stub(),
                st2 = stub();

            latte.wrap(5, true)(st1, st2);
            assertEquals(st1.called, false);
            assertEquals(st2.args[0], 5);
        },

        testWrapFunctionAsResolved : function(){
            var st1 = stub(),
                st2 = stub();

            latte.wrap(function(){return 5;})(st1, st2);
            assertEquals(st1.args[0](), 5);
            assertEquals(st2.called, false);
        },

        testLiftResolve : function(){
            var st1 = stub(),
                st2 = stub();

            latte.lift(function(val){
                return val + 5;
            })(latte.wrap(3))(st1, st2);

            assertEquals(st1.args[0], 8);
            assertEquals(st2.called, false);
        },

        testLiftReject : function(){
            var st1 = stub(),
                st2 = stub();

            latte.lift(null, function(val){
                return val + 5;
            })(latte.wrap(3, true))(st1, st2);

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
                latte.wrap(2),
                latte.wrap(3)
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
                latte.wrap(1),
                latte.Promise(function(resolve, reject){
                    h = reject;
                }),
                latte.wrap(3)
            ])(st1, st2);

            h('error');

            assertEquals(st1.called, false);
            assertEquals(st2.args[0], 'error');
        },

        testWpipe : function(){
            var st1 = stub(),
                st2 = stub(),
                p1 = function(){
                    return latte.wrap(1);
                },
                p2 = function(v){
                    return latte.Promise(function(resolve){
                        setTimeout(function(){
                            resolve(v + 2);
                        }, 0);
                    });
                },
                p3 = function(v){
                    return latte.wrap(v + 3);
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
                    return latte.wrap(1);
                },
                p2 = function(v){
                    return latte.Promise(function(resolve){
                        setTimeout(function(){
                            resolve(v + 2);
                        }, 0);
                    });
                },
                p3 = function(v){
                    return latte.wrap(v + 3);
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
                    return latte.wrap(1);
                },
                p2 = function(v){
                    return latte.Promise(function(resolve){
                        setTimeout(function(){
                            resolve(v + 2);
                        }, 0);
                    });
                },
                p3 = function(v){
                    return latte.wrap('error', true);
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
                latte.wrap(1),
                latte.wrap(2),
                latte.wrap(3)
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
                latte.wrap(1),
                latte.wrap('error', true),
                latte.wrap(3)
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
                latte.wrap(1),
                latte.wrap(2),
                latte.wrap(3)
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
                latte.wrap(1),
                latte.wrap('error', true),
                latte.wrap(3)
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
                latte.wrap(1),
                latte.wrap(2),
                latte.wrap(3)
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
                latte.wrap(1),
                latte.wrap('error', true),
                latte.wrap(3)
            ]))(st1, st2);

            assertEquals(st1.called, false);
            assertEquals(st2.args[0], 'error');
        }
    });
}());