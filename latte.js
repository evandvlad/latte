/**
* Autor: Evstigneev Andrey
* Date: 05.02.14
* Time: 1:02
*/

(function(global, initializer){

    'use strict';

    global.Latte = initializer();

    typeof module !== 'undefined' && module.exports && (module.exports = global.Latte);

}(this, function(){

    var Latte = {
            version : '1.16.0'
        },

        M_PROP = '___M',
        E_PROP = '___E',
        A_PROP = '___A',
        S_PROP = '___S',

        msmeta = {

            allseq : function(isResetAcc){
                return function(xs){
                    var len = xs.length;

                    return len ? this(function(h){
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
                    }) : this(curryLift([]));
                };
            },

            seq : function(mname){
                return function(ms){
                    return this[mname](ms).lift(function(vs){
                        return vs.reduce(function(acc, v){
                            return Latte.isE(acc) ? acc : (Latte.isE(v) ? v : (acc.push(v) && acc));
                        }, []);
                    });
                };
            },

            fold : function(mname){
                return function(f, init, ms){
                    return this[mname](ms).lift(function(vs){
                        return vs.reduce(f, init);
                    });
                };
            },

            lift : function(mname){
                return function(f, ms){
                    return this[mname](ms).lift(function(vs){
                        return f.apply(null, vs);
                    });
                };
            }
        };

    function curryLift(v){
        return function(f){
            return f(v);
        };
    }

    function mixMethods(oto, ofrom){
        return mixMethodsByTmpl(oto, ofrom, function(prop){
            return ofrom[prop];
        });
    }

    function mixMethodsByTmpl(oto, ofrom, proc){
        return Object.keys(ofrom || []).reduce(function(acc, prop){
            isFunction(ofrom[prop]) && (acc[prop] = proc(prop));
            return acc;
        }, oto);
    }

    function isFunction(v){
        return Object.prototype.toString.call(v) === '[object Function]';
    }

    function isObject(v){
        return !!(typeof v === 'object' && v);
    }

    function isEntity(f, prop){
        return function(v){
            return !!(f(v) && v[prop]);
        };
    }

    function setConstProp(o, prop, v){
        return Object.defineProperty(o, prop, {value : v});
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
        M.allseq = msmeta.allseq(true);
        M.seq = msmeta.seq('allseq');
        M.fold = msmeta.fold('seq');
        M.lift = msmeta.lift('seq');
        return mixMethods(M, ext);
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

    Latte.S = msextend(mcreate(function(ctor){
        var cbs = [];

        ctor(function(v){
            cbs.forEach(curryLift(v));
        });

        return function(f){
            cbs.push(f);
        };
    }, S_PROP), {

        pallseq : msmeta.allseq(false),
        pseq : msmeta.seq('pallseq'),
        pfold : msmeta.fold('pseq'),
        plift : msmeta.lift('pseq'),

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

    Latte.SH = mixMethods(mcreate(function(ctor){
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

    Latte.A = mixMethods(function A(f){

        mixMethodsByTmpl(f, Latte.M.prototype, function(prop){
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

    }, mixMethodsByTmpl({}, Latte.M, function(prop){
        return function(){
            var args = Array.prototype.slice.call(arguments);

            return this(function(v){
                args.push(args.pop().map(curryLift(v)));
                return Latte.M[prop].apply(Latte.M, args);
            });
        };
    }));

    Latte.isA = isEntity(isFunction, A_PROP);

    return Latte;
}));