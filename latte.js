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
            version : '4.0.0'
        },

        M_KEY = '___M',
        E_KEY = '___E',
        S_KEY = '___S',

        NOTHING = new String('Nothing'),

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

            seq : function(smeth){
                return function(xs){
                    return this[smeth](xs).lift(function(vs){
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

            spread : function(smeth, imeth){
                return function(f, xs, ctx){
                    return this[smeth](xs)[imeth](function(a){
                        return f.apply(ctx, a);
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

    function bindc(f, ctx){
        return function(v){
            return f.call(ctx, v);
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

    function gen(g, h, v){
        var gdata = g.next(v),
            gv = gdata.value;

        !gdata.done ? (Latte.isM(gv) ? gv.next(gen.bind(null, g, h)).fail(h) : gen(g, h, gv)) : h(gv);
    }

    Latte._State = function(executor, params){
        var handle = bindc(this._set, this);

        this._params = params;
        this._queue = [];
        this.val = NOTHING;

        params.async ?
            setTimeout(function(){
                executor(handle);
            }, 0) :
            executor(handle);
    };

    Latte._State.prototype.on = function(f){
        this._queue && this._queue.push(f);
        this._params.hold && this.val !== NOTHING && f(this.val);
    };

    Latte._State.prototype.reset = function(){
        this._queue = [];
        this.val = NOTHING;
    };

    Latte._State.prototype._set = function(v){
        if(this.val === NOTHING || !this._params.immutable){
            this._queue.forEach(lift(v));
            this._params.immutable && (this._queue = null);
            this.val = v;
        }
    };

    Latte._STATE_PRIVATE_PROP = '_____####![state]';

    function Build(params){

        function L(executor, ctx){
            if(!(this instanceof L)){
                return new L(executor, ctx);
            }

            this[Latte._STATE_PRIVATE_PROP] = new Latte._State(bindc(executor, ctx), params);
        }

        L.E = Latte.E;
        L.isE = Latte.isE;

        L.prototype.always = function(f, ctx){
            this[Latte._STATE_PRIVATE_PROP].on(bindc(f, ctx));
            return this;
        };

        L.prototype.next = function(f, ctx){
            return this.always(cond(this.constructor.isE, id, bindc(f, ctx)));
        };

        L.prototype.fail = function(f, ctx){
            return this.always(cond(this.constructor.isE, bindc(f, ctx), id));
        };

        L.prototype.bnd = function(f, ctx){
            return new this.constructor(function(c){
                return this.always(cond(this.constructor.isE, c, compose(meth('always', c), bindc(f, ctx))));
            }, this);
        };

        L.prototype.lift = function(f, ctx){
            return new this.constructor(function(c){
                return this.always(cond(this.constructor.isE, c, compose(c, bindc(f, ctx))));
            }, this);
        };

        L.prototype.raise = function(f, ctx){
            return new this.constructor(function(c){
                return this.always(cond(this.constructor.isE, compose(c, compose(this.constructor.E, bindc(f, ctx))), c));
            }, this);
        };

        L.prototype.when = function(f, ctx){
            return new this.constructor(function(c){
                return this.next(cond(bindc(f, ctx), c, id));
            }, this);
        };

        L.prototype.unless = function(f, ctx){
            return new this.constructor(function(c){
                return this.next(cond(bindc(f, ctx), id, c));
            }, this);
        };

        L.prototype.pass = function(v){
            return this.lift(constf(v));
        };

        L.prototype.wait = function(delay){
            var tid = null;

            return new this.constructor(function(c){
                return this.always(function(v){
                    tid && clearTimeout(tid);
                    tid = setTimeout(function(){
                        c(v);
                        tid = null;
                    }, delay);
                });
            }, this);
        };

        L.Hand = function(){
            var hm = {},
                val = NOTHING,
                f;

            hm.hand = function(v){
                if(val === NOTHING || !params.immutable){
                    val = v;
                    f && f(v);
                }
            };

            hm.inst = new this(function(h){
                f = h;
                val !== NOTHING && f(val);
            }, hm);

            return hm;
        };

        L.Gen = function(g, ctx){
            return new this(function(h){
                gen(bindc(g, ctx)(h), h);
            });
        };

        L.allseq = staticMetaMethods.allseq(true);
        L.seq = staticMetaMethods.seq('allseq');
        L.lift = staticMetaMethods.spread('seq', 'lift');
        L.bnd = staticMetaMethods.spread('seq', 'bnd');

        if(params.key === S_KEY){
            L.pallseq = staticMetaMethods.allseq(false);
            L.pseq = staticMetaMethods.seq('pallseq');
            L.plift = staticMetaMethods.spread('pseq', 'lift');
            L.pbnd = staticMetaMethods.spread('pseq', 'bnd');
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

    Latte.M = Build({immutable : true, hold : true, key : M_KEY, async : true});
    Latte.S = Build({immutable : false, hold : true, key : S_KEY, async : true});

    Latte.compose = function(fs, initVal){
        if(!fs.length){
            throw new Error('empty list');
        }

        return fs.reduce(function(acc, f){
            return acc.bnd(f);
        }, fs.shift()(initVal));
    };

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