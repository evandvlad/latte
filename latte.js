/**
* Autor: Evstigneev Andrey
* Date: 05.02.14
* Time: 1:02
*/

(function(global, initializer){

    global.Latte = initializer();

    if(typeof module !== 'undefined' && module.exports){
        module.exports = global.Latte;
    }

}(this, function(){

    'use strict';

    var Latte = {
            version : '1.23.0'
        },

        M_PROP = '___M',
        E_PROP = '___E',
        S_PROP = '___S',

        staticMetaMethods = {

            allseq : function(isResetAcc){
                return function(xs){
                    var len = xs.length;

                    return new this(len ? function(h){
                        var acc = [];

                        xs.forEach(function(x, i){
                            x.always(function(v){
                                acc[i] = v;

                                if(Object.keys(acc).length === len){
                                    h(acc);
                                    isResetAcc && (acc = []);
                                }
                            });
                        });

                    } : lift([]));
                };
            },

            seq : function(methname){
                return function(ms){
                    return this[methname](ms).lift(function(vs){
                        return vs.reduce(function(acc, v){
                            return Latte.isE(acc) ? acc : (Latte.isE(v) ? v : (acc.push(v) && acc));
                        }, []);
                    });
                };
            },

            fold : function(methname){
                return function(f, init, ms){
                    return this[methname](ms).lift(meth('reduce', f, init));
                };
            },

            lift : function(methname){
                return function(f, ms){
                    return this[methname](ms).lift(Function.prototype.apply.bind(f, null));
                };
            }
        };

    function id(v){
        return v;
    }

    function constf(v){
        return function(){
            return v;
        };
    }

    function isFunction(v){
        return Object.prototype.toString.call(v) === '[object Function]';
    }

    function isObject(v){
        return Object.prototype.toString.call(v) === '[object Object]';
    }

    function compose(){
        var args = Array.prototype.slice.call(arguments);

        return function(val){
            return args.reduce(function(v, f){
                return f(v);
            }, val);
        };
    }

    function lift(v){
        return function(f){
            return f(v);
        };
    }

    function cond(p, t, f){
        return function(v){
            return p(v) ? t(v) : f(v);
        };
    }

    function meth(mname){
        var args = Array.prototype.slice.call(arguments, 1);

        return function(o){
            return o[mname].apply(o, args);
        };
    }

    function isEntity(f, prop){
        return function(v){
            return f(v) && !!v[prop];
        };
    }

    function MState(executor, params){
        this._params = params;
        this._queue = [];
        this._isval = false;
        executor(this._set.bind(this));
    }

    MState.prototype.on = function(f){
        this._queue && this._queue.push(f);
        this._params.hold && this._isval && f(this._val);
    };

    MState.prototype._set = function(v){
        if(!this._isval || !this._params.immutable){
            this._queue.forEach(lift(v));
            this._params.immutable && (this._queue = null);
            this._val = v;
        }

        this._isval = true;
    };

    function Build(params){

        function M(executor){
            if(!(this instanceof M)){
                return new M(executor);
            }

            this._state = new MState(executor, params);
        }

        M.prototype.always = function(f){
            this._state.on(f);
            return this;
        };

        M.prototype.next = function(f){
            return this.always(cond(Latte.isE, id, f));
        };

        M.prototype.fail = function(f){
            return this.always(cond(Latte.isE, f, id));
        };

        M.prototype.bnd = function(f){
            var self = this;
            return new this.constructor(function(c){
                return self.always(cond(Latte.isE, c, compose(f, meth('always', c))));
            });
        };

        M.prototype.lift = function(f){
            var self = this;
            return new this.constructor(function(c){
                return self.always(cond(Latte.isE, c, compose(f, c)));
            });
        };

        M.prototype.raise = function(f){
            var self = this;
            return new this.constructor(function(c){
                return self.always(cond(Latte.isE, compose(f, Latte.E, c), c));
            });
        };

        M.prototype.when = function(f){
            var self = this;
            return new this.constructor(function(c){
                return self.next(cond(f, c, id));
            });
        };

        M.prototype.unless = function(f){
            var self = this;
            return new this.constructor(function(c){
                return self.next(cond(f, id, c));
            });
        };

        M.prototype.pass = function(v){
            return this.lift(constf(v));
        };

        M.allseq = staticMetaMethods.allseq(true);
        M.seq = staticMetaMethods.seq('allseq');
        M.fold = staticMetaMethods.fold('seq');
        M.lift = staticMetaMethods.lift('seq');

        if(params.mkey === S_PROP){
            M.pallseq = staticMetaMethods.allseq(false);
            M.pseq = staticMetaMethods.seq('pallseq');
            M.pfold = staticMetaMethods.fold('pseq');
            M.plift = staticMetaMethods.lift('pseq');
            M.any = function(ss){
                return this(function(h){
                    ss.forEach(meth('always', h));
                });
            };
        }

        Object.defineProperty(M.prototype, params.mkey, {value : true});

        return M;
    }

    function BuildHand(M){
        return function(){
            var hm = {};

            hm.inst = M(function(h){
                hm.hand = h;
            });

            return hm;
        };
    }

    Latte.E = function(v){
        return Object.defineProperty(constf(v), E_PROP, {value : true});
    };

    Latte.M = Build({immutable : true, hold : true, mkey : M_PROP});
    Latte.Mv = compose(lift, Latte.M);
    Latte.S = Build({immutable : false, hold : false, mkey : S_PROP});
    Latte.SH = Build({immutable : false, hold : true, mkey : S_PROP});
    Latte.Mh = BuildHand(Latte.M);
    Latte.Sh = BuildHand(Latte.S);
    Latte.SHh = BuildHand(Latte.SH);

    Latte.isE = isEntity(isFunction, E_PROP);
    Latte.isM = isEntity(isObject, M_PROP);
    Latte.isS = isEntity(isObject, S_PROP);

    return Latte;
}));