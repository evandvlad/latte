/**
* Autor: Evstigneev Andrey
* Date: 05.02.14
* Time: 1:02
*/

(function(global, initializer){

    'use strict';

    global.Latte = initializer();

    if(typeof module !== 'undefined' && module.exports){
        module.exports = global.Latte;
    }

}(this, function(){

    var Latte = {
            version : '1.19.0'
        },

        M_PROP = '___M',
        E_PROP = '___E',
        A_PROP = '___A',
        S_PROP = '___S',

        staticMethodsMeta = {

            allseq : function(isResetAcc){

                return function(xs){
                    var len = xs.length;

                    return this(len ? function(h){
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

    function noop(){}

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

    function mixMethods(oto, ofrom){
        return mixMethodsWith(oto, ofrom, function(prop){
            return ofrom[prop];
        });
    }

    function mixMethodsWith(oto, ofrom, proc){
        return Object.keys(ofrom || []).reduce(function(acc, prop){
            isFunction(ofrom[prop]) && (acc[prop] = proc(prop));
            return acc;
        }, oto);
    }

    function isFunction(v){
        return Object.prototype.toString.call(v) === '[object Function]';
    }

    function isObject(v){
        return Object.prototype.toString.call(v) === '[object Object]';
    }

    function isEntity(f, prop){
        return function(v){
            return f(v) && !!v[prop];
        };
    }

    function CreateMonad(notifier, mkey){

        function M(ctor){
            if(!(this instanceof M)){
                return new M(ctor);
            }

            this._notifier = notifier(ctor);
        }

        M.prototype.always = function(f){
            this._notifier(f);
            return this;
        };

        M.prototype.next = function(f){
            return this.always(cond(Latte.isE, noop, f));
        };

        M.prototype.fail = function(f){
            return this.always(cond(Latte.isE, f, noop));
        };

        M.prototype.bnd = function(f){
            return new this.constructor(function(c){
                this._notifier(cond(Latte.isE, c, compose(f, meth('always', c))));
            }.bind(this));
        };

        M.prototype.lift = function(f){
            return new this.constructor(function(c){
                this._notifier(cond(Latte.isE, c, compose(f, c)));
            }.bind(this));
        };

        M.prototype.raise = function(f){
            return new this.constructor(function(c){
                this._notifier(cond(Latte.isE, compose(f, Latte.E, c), c));
            }.bind(this));
        };

        Object.defineProperty(M.prototype, mkey, {value : true});

        return M;
    }

    function extendMonadStaticMethods(M, ext){
        M.allseq = staticMethodsMeta.allseq(true);
        M.seq = staticMethodsMeta.seq('allseq');
        M.fold = staticMethodsMeta.fold('seq');
        M.lift = staticMethodsMeta.lift('seq');
        return mixMethods(M, ext);
    }

    function CreateHandMonad(M){
        return function(){
            var hm = {};

            hm.inst = M(function(h){
                hm.hand = h;
            });

            return hm;
        };
    }

    Latte.E = function(v){
        return Object.defineProperty(function E(){
            return v;
        }, E_PROP, {value : true});
    };

    Latte.M = extendMonadStaticMethods(CreateMonad(function(ctor){
        var cbs = [],
            isval = false,
            val;

        ctor(function(v){
            if(!isval){
                val = v;
                isval = true;
                cbs.forEach(lift(val));
                cbs = [];
            }
        });

        return function(f){
            isval ? f(val) : cbs.push(f);
        };
    }, M_PROP));

    Latte.Mv = compose(lift, Latte.M);

    Latte.S = extendMonadStaticMethods(CreateMonad(function(ctor){
        var cbs = [];

        ctor(compose(lift, cbs.forEach.bind(cbs)));

        return function(f){
            cbs.push(f);
        };
    }, S_PROP), {

        pallseq : staticMethodsMeta.allseq(false),
        pseq : staticMethodsMeta.seq('pallseq'),
        pfold : staticMethodsMeta.fold('pseq'),
        plift : staticMethodsMeta.lift('pseq'),

        any : function(ss){
            return this(function(h){
                ss.forEach(meth('always', h));
            });
        }
    });

    Latte.SH = mixMethods(CreateMonad(function(ctor){
        var cbs = [],
            isval = false,
            val;

        ctor(function(v){
            isval = true;
            val = v;
            cbs.forEach(lift(val));
        });

        return function(f){
            cbs.push(f) && isval && f(val);
        };
    }, S_PROP), Latte.S);

    Latte.A = mixMethodsWith(function A(f){

        return Object.defineProperty(mixMethodsWith(f, Latte.M.prototype, function(prop){
            return function(g){
                return A(function(v){
                    return this(v)[prop](g);
                }.bind(this));
            };
        }), A_PROP, {value : true});

    }, Latte.M, function(prop){

        return function(){
            var args = Array.prototype.slice.call(arguments);

            return this(function(v){
                args.push(args.pop().map(lift(v)));
                return Latte.M[prop].apply(Latte.M, args);
            });
        };
    });

    Latte.Mh = CreateHandMonad(Latte.M);
    Latte.Sh = CreateHandMonad(Latte.S);
    Latte.SHh = CreateHandMonad(Latte.SH);

    Latte.isE = isEntity(isFunction, E_PROP);
    Latte.isM = isEntity(isObject, M_PROP);
    Latte.isS = isEntity(isObject, S_PROP);
    Latte.isA = isEntity(isFunction, A_PROP);

    return Latte;
}));