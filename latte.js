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

    var M_PROP = '___M',
        E_PROP = '___E',
        A_PROP = '___A',
        S_PROP = '___S',
        PS_PROP = '___PS',

        Latte = {
            version : '1.15.1'
        };

    function curryLift(v){
        return function(f){
            return f(v);
        };
    }

    function mix(o1, o2){
        return (o2 ? Object.keys(o2) : []).reduce(function(acc, prop){
            acc[prop] = o2[prop];
            return acc;
        }, o1);
    }

    function isFunction(v){
        return Object.prototype.toString.call(v) === '[object Function]';
    }

    function isObject(v){
        return !!(typeof v === 'object' && v);
    }

    function isObjectOrFunction(v){
        return isObject(v) || isFunction(v);
    }

    function isEntity(f, prop){
        return function(v){
            return !!(f(v) && v[prop]);
        };
    }

    function implementByTmpl(ofrom, oto, proc){
        return Object.keys(ofrom).reduce(function(acc, prop){
            isFunction(ofrom[prop]) && (acc[prop] = proc(prop));
            return acc;
        }, oto);
    }

    function setConstProp(o, prop, v){
        return Object.defineProperty(o, prop, {
            enumerable : false,
            configurable : false,
            writable : false,
            value : v
        });
    }

    function mcreate(notifier, mkey){

        function M(ctor){
            if(!(this instanceof M)){
                return new M(ctor);
            }

            this.notifier = notifier(ctor);
        }

        M.prototype.always = function(f){
            this.notifier(f);
            return this;
        };

        M.prototype.next = function(f){
            return this.always(function(v){
                !Latte.isE(v) && f(v);
            });
        };

        M.prototype.fail = function(f){
            return this.always(function(v){
                Latte.isE(v) && f(v);
            });
        };

        M.prototype.bnd = function(f){
            var self = this;

            return new this.constructor(function(c){
                self.notifier(function(v){
                    !Latte.isE(v) ? f(v).always(c) : c(v);
                });
            });
        };

        M.prototype.lift = function(f){
            var self = this;

            return new this.constructor(function(c){
                self.notifier(function(v){
                    !Latte.isE(v) ? c(f(v)) : c(v);
                });
            });
        };

        M.prototype.raise = function(f){
            var self = this;

            return new this.constructor(function(c){
                self.notifier(function(v){
                    Latte.isE(v) ? c(Latte.E(f(v))) : c(v);
                });
            });
        };

        setConstProp(M.prototype, mkey, true);

        return M;
    }

    function msextend(M, ext){

        M.allseq = allseqTmpl(true);

        M.seq = function(ms){
            return this.allseq(ms).lift(function(vs){
                return vs.reduce(function(acc, v){
                    return Latte.isE(acc) ? acc : (Latte.isE(v) ? v : (acc.push(v) && acc));
                }, []);
            });
        };

        M.fold = function(f, init, ms){
            return this.seq(ms).lift(function(vs){
                return vs.reduce(f, init);
            });
        };

        M.lift = function(f, ms){
            return this.seq(ms).lift(function(vs){
                return f.apply(null, vs);
            });
        };

        return mix(M, ext);
    }

    function allseqTmpl(isResetAcc){
        return function(xs){
            return xs.length ? this(function(h){
                var len = xs.length,
                    acc = [];

                xs.forEach(function(x, i){
                    x.always(function(v){
                        acc[i] = v;

                        if(Object.keys(acc).length === len){
                            h(acc);
                            isResetAcc && (acc = []);
                        }
                    });
                });

            }) : this(curryLift([]));
        };
    }

    Latte.E = function(v){
        return setConstProp(function E_(){
            return v;
        }, E_PROP, true);
    };

    Latte.isE = isEntity(isFunction, E_PROP);

    Latte.M = msextend(mcreate(function(ctor){
        var cbs = [],
            isval = false,
            val;

        ctor(function(v){
            if(!isval){
                val = v;
                isval = true;
                cbs.forEach(curryLift(val));
                cbs = [];
            }
        });

        return function(f){
            isval ? f(val) : cbs.push(f);
        };
    }, M_PROP));

    Latte.Mv = function(v){
        return Latte.M(curryLift(v));
    };

    Latte.isM = isEntity(isObject, M_PROP);

    Latte.S = (function(){

        var S = mcreate(function(ctor){
                var cbs = [];

                ctor(function(v){
                    cbs.forEach(curryLift(v));
                });

                return function(f){
                    cbs.push(f);
                };
            }, S_PROP),

            Sp = {

                allseq : allseqTmpl(false).bind(S),

                seq : function(){
                    return S.seq.apply(Sp, arguments);
                }
            };

        return msextend(S, {

            pallseq : Sp.allseq,

            pseq : Sp.seq,

            pfold : function(){
                return this.fold.apply(Sp, arguments);
            },

            plift : function(){
                return this.lift.apply(Sp, arguments);
            },

            any : function(ss){
                if(!ss.length){
                    throw Error('Latte [method: any] error: Empty list');
                }

                return this(function(h){
                    ss.forEach(function(s){
                        s.always(h);
                    });
                });
            }
        });
    }());

    Latte.SH = mix(mcreate(function(ctor){
        var cbs = [],
            isval = false,
            val;

        ctor(function(v){
            isval = true;
            val = v;
            cbs.forEach(curryLift(val));
        });

        return function(f){
            cbs.push(f);
            isval && f(val);
        };
    }, S_PROP), Latte.S);

    Latte.isS = isEntity(isObject, S_PROP);

    Latte.A = mix(function A(f){

        implementByTmpl(Latte.M.prototype, f, function(prop){
            return function(g){
                var self = this;

                return A(function(v){
                    return self(v)[prop](g);
                });
            }
        });

        f.radd = f.bnd;

        f.ladd = function(a){
            return a.radd(this);
        };

        return setConstProp(f, A_PROP, true);

    }, implementByTmpl(Latte.M, {}, function(prop){
        return function(){
            var args = Array.prototype.slice.call(arguments);

            return this(function(v){
                args.push(args.pop().map(curryLift(v)));
                return Latte.M[prop].apply(Latte.M, args);
            });
        };
    }));

    Latte.Aloop = function(a, f){
        return function(v){
            return Latte.M(function(h){
                var na = a.next(function(val){
                    f(val).always(na);
                }).fail(h);

                na(v);
            });
        };
    };

    Latte.isA = isEntity(isFunction, A_PROP);

    Latte.PS = (function(){

        function PS(){
            if(!(this instanceof PS)){
                return new PS();
            }

            this.sbs = {};
        }

        PS.prototype.pub = function(e, v){
            return (this.sbs[e] || []).map(curryLift(v));
        };

        PS.prototype.sub = function(e, f){
            (this.sbs[e] = this.sbs[e] || []).push(f);
            return this;
        };

        PS.prototype.once = function(e, f){
            var self = this;

            return this.sub(e, function _f(v){
                self.unsub(e, _f);
                return f(v);
            });
        };

        PS.prototype.unsub = function(e, f){
           this.sbs[e] = (this.sbs[e] || []).filter(function(c){
               return c !== f;
           });

           return this;
        };

        PS.prototype.unsuball = function(e){
            delete this.sbs[e];
            return this;
        };

        setConstProp(PS.prototype, PS_PROP, true);
        setConstProp(PS, PS_PROP, true);
        setConstProp(PS, 'sbs', {});

        return mix(PS, PS.prototype);
    }());

    Latte.isPS = isEntity(isObjectOrFunction, PS_PROP);

    return Latte;
}));