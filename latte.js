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

    Latte.isM = function(v){
        return !!(typeof v === 'object' && v && v[M_PROP]);
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

                lift : function(f){
                    return Latte.lift(f, [self]);
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

        defineConstProp_(self, M_PROP, true);

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
        return Latte.seq(ms).bnd(function(vs){
            return Latte(f.apply(null, vs));
        });
    };

    Latte.A = function(f){

        function A_(v){
            return f(v);
        }

        A_.bnd = function(g){
            return Latte.A(function(v){
                return f(v).bnd(g);
            });
        };

        A_.lift = function(g){
            return Latte.A(function(v){
                return f(v).lift(g);
            });
        };

        return A_;
    };

    Latte.version = '1.7.0';

    return Latte;
}));