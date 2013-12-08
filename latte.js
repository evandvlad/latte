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

    var STATE_RESOLVE = 1,
        STATE_REJECT = 0,

        aproto = Array.prototype,

        latte;

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

    function fcompose(f1, f2){
        return function(){
            return f1(fapply(f2, arguments));
        };
    }

    function aslice(arr, from, to){
        return aproto.slice.call(arr, from, to);
    }

    function aconcat(){
        return aproto.concat.apply(aproto, arguments);
    }

    function makeCallbacks(onResolve, onReject){
        var cbs = [];

        cbs[STATE_RESOLVE] = onResolve;
        cbs[STATE_REJECT] = onReject;

        return function(state, val){
            return typeof cbs[state] === 'function' ? cbs[state](val) : val;
        };
    }

    function combineCallbacks(onFulfilled, onRejected, resolver, rejector){
        var callbacks = makeCallbacks(onFulfilled || resolver, onRejected || rejector),
            handles = aslice(arguments, 2);

        return function(state, val){
            var res = fapply(callbacks, arguments);
            return typeof res === 'function' ? fapply(res, handles) : fapply(fapply(makeCallbacks, handles), arguments);
        };
    }

    function PState(){
        var pending = [],
            unit = [];

        return {

            setValue : function(state, val){
                if(!unit.length){
                    unit.push(state, val);

                    while(pending.length){
                        fapply(pending.shift(), unit);
                    }
                }
            },

            onValue : function(onFulfilled, onRejected, resolver, rejecter){
                return unit.length ?
                    fapply(fapply(combineCallbacks, arguments), unit) :
                    pending.push(fapply(combineCallbacks, arguments));
            }
        };
    }

    function Promise(ctor){
        var pstate = PState();

        ctor(fbind(pstate.setValue, STATE_RESOLVE), fbind(pstate.setValue, STATE_REJECT));

        return function(onFulfilled, onRejected){
            return Promise(fbind(pstate.onValue, onFulfilled, onRejected));
        };
    }

    function unit(state, val){
        return (function(args){
            return Promise(function(onFulfilled, onRejected){
                fapply(fapply(makeCallbacks, arguments), args);
            });
        }(arguments));
    }

    latte = {

        version : '0.0.1',

        Promise : Promise,

        wrapAsResolved : function(val){
            return unit(STATE_RESOLVE, val);
        },

        wrapAsRejected : function(val){
            return unit(STATE_REJECT, val);
        },

        bind : function(unit, resolve, reject){
            var cbs = fapply(makeCallbacks, aslice(arguments, 1));

            return unit(
                fcompose(latte.wrapAsResolved, fbind(cbs, STATE_RESOLVE)),
                fcompose(latte.wrapAsRejected, fbind(cbs, STATE_REJECT))
            );
        },

        lift : function(resolve, reject){
            return (function(args){
                return function(unit){
                    return fapply(latte.bind, aconcat([unit], args));
                };
            }(aslice(arguments)));
        },

        collect : function(units){
            var ticks = units.length,
                processed = 0;

            return ticks ? latte.Promise(function(onFulfilled, onRejected){
                units.reduce(function(acc, unit, i){
                    unit(function(val){
                        acc[i] = val;
                        ++processed === ticks && onFulfilled(acc);
                    }, onRejected);

                    return acc;
                }, []);
            }) : latte.wrapAsResolved([]);
        },

        wpipe : function(wrapped, ival){
            return wrapped.reduce(function(acc, wunit){
                return acc(wunit);
            }, latte.wrapAsResolved(ival));
        },

        lconcat : function(){
            return latte.collect(fapply(aconcat, aslice(arguments)));
        },

        lfilter : function(units, f){
            return latte.bind(latte.collect(units), function(values){
                return values.filter(f);
            });
        },

        lmap : function(units, f){
            return latte.bind(latte.collect(units), function(values){
                return values.map(f);
            });
        },

        lfold : function(units, f, ival){
            return latte.bind(latte.collect(units), function(values){
                return values.reduce(f, ival);
            });
        }
    };

    return latte;
}));