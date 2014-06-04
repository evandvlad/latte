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
            version : '2.1.2'
        },

        M_KEY = '___M',
        E_KEY = '___E',
        S_KEY = '___S',

        aslice = Array.prototype.slice,
        toString = Object.prototype.toString,

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
                return function(xs){
                    return this[methname](xs).lift(function(vs){
                        var ret = [],
                            l = vs.length,
                            i = 0,
                            v;

                        for(; i < l; i += 1){
                            v = vs[i];

                            if(xs[i].constructor.isE(v)){
                                ret = null;
                                return v;
                            }

                            ret.push(v);
                        }

                        return ret;
                    });
                };
            },

            fold : function(methname){
                return function(f, init, xs){
                    return this[methname](xs).lift(meth('reduce', f, init));
                };
            },

            lift : function(methname){
                return function(f, xs){
                    return this[methname](xs).lift(function(a){
                        return f.apply(null, a);
                    });
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

    function bind(f, ctx){
        return function(){
            return f.apply(ctx, arguments);
        };
    }

    function compose(f, g){
        return function(x){
            return f(g(x));
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
        var args = aslice.call(arguments, 1);
        return function(o){
            return o[mname].apply(o, args);
        };
    }

    function mix(oto, ofrom){
        return Object.keys(ofrom || []).reduce(function(acc, prop){
            acc[prop] = ofrom[prop];
            return acc;
        }, oto);
    }

    function isFunction(v){
        return toString.call(v) === '[object Function]';
    }

    function isObject(v){
        return toString.call(v) === '[object Object]';
    }

    function isEntity(f, prop){
        return function(v){
            return f(v) && !!v[prop];
        };
    }

    Latte._State = function(executor, params){
        this._params = params;
        this._queue = [];
        this.isval = false;
        executor(bind(this._set, this));
    };

    Latte._State.prototype.on = function(f){
        this._queue && this._queue.push(f);
        this._params.hold && this.isval && f(this.val);
    };

    Latte._State.prototype.reset = function(){
        this._queue = [];
        this.isval = false;
        delete this.val;
    };

    Latte._State.prototype._set = function(v){
        if(!this.isval || !this._params.immutable){
            this._queue.forEach(lift(v));
            this._params.immutable && (this._queue = null);
            this.val = v;
        }

        this.isval = true;
    };

    function Build(params){

        function L(executor){
            if(!(this instanceof L)){
                return new L(executor);
            }

            this._state = new Latte._State(executor, params);
        }

        L.E = Latte.E;
        L.isE = Latte.isE;

        L.prototype.always = function(f){
            this._state.on(f);
            return this;
        };

        L.prototype.next = function(f){
            return this.always(cond(this.constructor.isE, id, f));
        };

        L.prototype.fail = function(f){
            return this.always(cond(this.constructor.isE, f, id));
        };

        L.prototype.bnd = function(f){
            var self = this;
            return new this.constructor(function(c){
                return self.always(cond(self.constructor.isE, c, compose(meth('always', c), f)));
            });
        };

        L.prototype.lift = function(f){
            var self = this;
            return new this.constructor(function(c){
                return self.always(cond(self.constructor.isE, c, compose(c, f)));
            });
        };

        L.prototype.raise = function(f){
            var self = this;
            return new this.constructor(function(c){
                return self.always(cond(self.constructor.isE, compose(c, compose(self.constructor.E, f)), c));
            });
        };

        L.prototype.when = function(f){
            var self = this;
            return new this.constructor(function(c){
                return self.next(cond(f, c, id));
            });
        };

        L.prototype.unless = function(f){
            var self = this;
            return new this.constructor(function(c){
                return self.next(cond(f, id, c));
            });
        };

        L.prototype.pass = function(v){
            return this.lift(constf(v));
        };

        L.Hand = function(){
            var hm = {};
            hm.inst = new this(function(h){
                hm.hand = h;
            });
            return hm;
        };

        L.allseq = staticMetaMethods.allseq(true);
        L.seq = staticMetaMethods.seq('allseq');
        L.fold = staticMetaMethods.fold('seq');
        L.lift = staticMetaMethods.lift('seq');

        if(params.key === S_KEY){
            L.pallseq = staticMetaMethods.allseq(false);
            L.pseq = staticMetaMethods.seq('pallseq');
            L.pfold = staticMetaMethods.fold('pseq');
            L.plift = staticMetaMethods.lift('pseq');
            L.any = function(ss){
                return new this(function(h){
                    ss.forEach(meth('always', h));
                });
            };
        }

        if(params.key === M_KEY){
            L.Pack = function(v){
                return new this(lift(v));
            };
        }

        Object.defineProperty(L.prototype, params.key, {value : true});

        return L;
    }

    Latte.E = function(v){
        return Object.defineProperty(constf(v), E_KEY, {value : true});
    };

    Latte.isE = isEntity(isFunction, E_KEY);
    Latte.isM = isEntity(isObject, M_KEY);
    Latte.isS = isEntity(isObject, S_KEY);

    Latte.isL = function(v){
        return Latte.isM(v) || Latte.isS(v);
    };

    Latte.M = Build({immutable : true, hold : true, key : M_KEY});
    Latte.S = Build({immutable : false, hold : false, key : S_KEY});
    Latte.SH = Build({immutable : false, hold : true, key : S_KEY});

    Latte.extend = function(L, ext){
        var Ctor;

        ext = ext || {};

        Ctor = ext.hasOwnProperty('constructor') ?
            ext.constructor :
            function Ctor(executor){
                if(!(this instanceof Ctor)){
                    return new Ctor(executor);
                }

                L.call(this, executor);
            };

        Ctor.prototype = Object.create(L.prototype);
        Ctor.prototype.constructor = Ctor;
        mix(Ctor.prototype, ext);

        return mix(Ctor, L);
    };

    return Latte;
}));