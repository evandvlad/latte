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

    var LATTE_PROP = '___LATTE',
        E_PROP = '___E';

    function defineConstProp_(o, prop, v){
        return Object.defineProperty(o, prop, {
            enumerable : false,
            configurable : false,
            writable : false,
            value : v
        });
    }

    function Later_(ctor){
        var cbs = [],
            isval = false,
            v;

        ctor(function(val){
            if(!isval){
                v = val;
                isval = true;

                while(cbs.length){
                    cbs.shift()(v);
                }
            }
        });

        return function(f){
            isval ? f(v) : cbs.push(f);
        };
    }

    function Latte(v){
        return Latte.Later(function(f){
            f(v);
        });
    }

    Latte.isLatte = function(v){
        return !!(typeof v === 'object' && v && v[LATTE_PROP]);
    };

    Latte.E = function(v){
        return defineConstProp_(function E_(){
            return v;
        }, E_PROP, true);
    };

    Latte.isE = function(v){
        return !!(Object.prototype.toString.call(v) === "[object Function]" && v[E_PROP]);
    };

    Latte.Later = function(ctor){

        var lt = Later_(ctor),

            self = {

                always : function(f){
                    lt(f);
                    return self;
                },

                next : function(f){
                    return self.always(function(v){
                        !Latte.isE(v) && f(v);
                    });
                },

                fail : function(f){
                    return self.always(function(v){
                        Latte.isE(v) && f(v);
                    });
                },

                bnd : function(f){
                    return Latte.Later(function(c){
                        lt(function(v){
                            !Latte.isE(v) ? f(v).always(c) : c(v);
                        });
                    });
                },

                lift : function(f, ms){
                    return Latte.lift(f, [self].concat(ms || []));
                },

                raise : function(f){
                    return Latte.Later(function(c){
                        lt(function(v){
                            Latte.isE(v) ? Latte(Latte.E(f(v))).always(c) : c(v);
                        });
                    });
                },

                seq : function(ms){
                    return Latte.seq([self].concat(ms));
                }
            };

        defineConstProp_(self, LATTE_PROP, true);

        return self;
    };

    Latte.seq = function(ms){
        return Latte.allseq(ms).bnd(function(vs){
            return Latte(vs.reduce(function(acc, v){
                return Latte.isE(acc) ? acc : (Latte.isE(v) ? v : (acc.push(v) && acc));
            }, []));
        });
    };

    Latte.fold = function(f, init, ms){
        return Latte.seq(ms).lift(function(vs){
            return vs.reduce(f, init);
        });
    };

    Latte.allseq = function(ms){
        var ticks = ms.length,
            processed = 0;

        return ticks ? Latte.Later(function(h){
            ms.reduce(function(acc, m, i){
                m.always(function(v){
                    acc[i] = v;
                    ++processed === ticks && h(acc);
                });

                return acc;
            }, []);
        }) : Latte([]);
    };

    Latte.lift = function(f, ms){
        return Latte.seq(Array.isArray(ms) ? ms : [ms]).bnd(function(vs){
            return Latte(f.apply(null, vs));
        });
    };

    Latte.A = function(f){

        function A_(v){
            return f(v);
        }

        A_.abnd = function(g){
            return Latte.A(function(v){
                return f(v).bnd(g);
            });
        };

        A_.alift = function(g){
            return Latte.A(function(v){
                return f(v).lift(g);
            });
        };

        return A_;
    };

    Latte.version = '1.5.0';

    return Latte;
}));