/**
 * Autor: Evstigneev Andrey
 * Date: 05.12.13
 * Time: 1:45
 */

(function(global, initializer){

    'use strict';

    global.latte = initializer();

    if(typeof module !== 'undefined' && module.exports){
        module.exports = global.latte;
    }

}(this, function(){

    var STATUS_RESOLVE = 1,
        STATUS_REJECT = 0,

        aproto = Array.prototype,
        latte;

    function pass(value){
        return value;
    }

    function fapply(f, args){
        return f.apply(null, args);
    }

    function fbind(f){
        return (function(args){
            return function(){
                return fapply(f, aconcat(args, aslice(arguments)));
            };
        }(aslice(arguments, 1)));
    }

    function funbind(f){
        return aslice(arguments, 1).reduce(function(acc, args){
            return acc = fapply(acc, args);
        }, f);
    }

    function fcompose(){
        return (function(args){
            return function(){
                return aslice(args, 0, -1).reduceRight(function(acc, f){
                    return acc = f(acc);
                }, fapply(args[args.length - 1], arguments));
            };
        }(arguments));
    }

    function aslice(arr, from, to){
        return aproto.slice.call(arr, from, to);
    }

    function aconcat(){
        return aproto.concat.apply(aproto, arguments);
    }

    function makeHandler(onResolve, onReject){
        return function(status, val){
            return ((status === STATUS_RESOLVE ? onResolve : onReject) || pass)(val);
        };
    }

    function combineCallbacks(onFulfilled, onRejected, resolver, rejector){
        return function(state, val){
            var res = fapply(makeHandler(onFulfilled || resolver, onRejected || rejector), arguments),
                handles = [resolver, rejector];

            return typeof res === 'function' ? fapply(res, handles) : funbind(makeHandler, handles, arguments);
        };
    }

    function PState(){
        var pending = [],
            value = [];

        return {

            setValue : function(state, val){
                if(!value.length){
                    value.push(state, val);

                    while(pending.length){
                        fapply(pending.shift(), value);
                    }
                }
            },

            onValue : function(onFulfilled, onRejected, resolver, rejecter){
                return value.length ?
                    funbind(combineCallbacks, arguments, value) :
                    pending.push(fapply(combineCallbacks, arguments));
            }
        };
    }

    function Promise(ctor){
        var pstate = PState();

        ctor(fbind(pstate.setValue, STATUS_RESOLVE), fbind(pstate.setValue, STATUS_REJECT));

        return function(onFulfilled, onRejected){
            return Promise(fbind(pstate.onValue, onFulfilled, onRejected));
        };
    }

    function unit(status, val){
        return (function(args){
            return Promise(function(onFulfilled, onRejected){
                funbind(makeHandler, arguments, args);
            });
        }(arguments));
    }

    latte = {

        version : '0.2.0',

        Promise : Promise,

        wrap : function(val, isRejected){
            return unit(isRejected ? STATUS_REJECT : STATUS_RESOLVE, val);
        },

        lift : function(resolve, reject){
            return (function(args){
                return function(promise){
                    var cbs = fapply(makeHandler, args);

                    return promise(
                        fcompose(fbind(unit, STATUS_RESOLVE), fbind(cbs, STATUS_RESOLVE)),
                        fcompose(fbind(unit, STATUS_REJECT), fbind(cbs, STATUS_REJECT))
                    );
                };
            }(arguments));
        },

        collect : function(promises){
            var ticks = promises.length,
                processed = 0;

            return ticks ? Promise(function(onFulfilled, onRejected){
                promises.reduce(function(acc, promise, i){
                    promise(function(val){
                        acc[i] = val;
                        ++processed === ticks && onFulfilled(acc);
                    }, onRejected);

                    return acc;
                }, []);
            }) : unit(STATUS_RESOLVE, []);
        },

        wpipe : function(wrapped, ival){
            return wrapped.reduce(function(acc, wpromise){
                return acc(wpromise);
            }, unit(STATUS_RESOLVE, ival));
        }
    };

    return latte;
}));