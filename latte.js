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

        Latte = {
            version : '1.9.0'
        };

    function defineConstProp(o, prop, v){
        return Object.defineProperty(o, prop, {
            enumerable : false,
            configurable : false,
            writable : false,
            value : v
        });
    }

    function isFunction(v){
        return Object.prototype.toString.call(v) === "[object Function]";
    }

    Latte.E = function(v){
        return defineConstProp(function E_(){
            return v;
        }, E_PROP, true);
    };

    Latte.isE = function(v){
        return !!(isFunction(v) && v[E_PROP]);
    };

    Latte.M = (function(Latte){

        function M(v){
            return M.Later(function(f){
                f(v);
            });
        }

        function later(ctor){
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

        M.Later = function(ctor){
            var lt = later(ctor),

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
                        return M.Later(function(c){
                            lt(function(v){
                                !Latte.isE(v) ? f(v).always(c) : c(v);
                            });
                        });
                    },

                    lift : function(f){
                        return M.lift(f, [self]);
                    },

                    raise : function(f){
                        return M.Later(function(c){
                            lt(function(v){
                                Latte.isE(v) ? M(Latte.E(f(v))).always(c) : c(v);
                            });
                        });
                    },

                    seq : function(ms){
                        return M.seq([self].concat(ms));
                    }
                };

            return defineConstProp(self, M_PROP, true);
        };

        M.seq = function(ms){
            return M.allseq(ms).bnd(function(vs){
                return M(vs.reduce(function(acc, v){
                    return Latte.isE(acc) ? acc : (Latte.isE(v) ? v : (acc.push(v) && acc));
                }, []));
            });
        };

        M.allseq = function(ms){
            var ticks = ms.length,
                processed = 0;

            return ticks ? M.Later(function(h){
                ms.reduce(function(acc, m, i){
                    m.always(function(v){
                        acc[i] = v;
                        ++processed === ticks && h(acc);
                    });

                    return acc;
                }, []);
            }) : M([]);
        };

        M.fold = function(f, init, ms){
            return M.seq(ms).lift(function(vs){
                return vs.reduce(f, init);
            });
        };

        M.lift = function(f, ms){
            return M.seq(ms).bnd(function(vs){
                return M(f.apply(null, vs));
            });
        };

        return M;

    }(Latte));

    Latte.isM = function(v){
        return !!(typeof v === 'object' && v && v[M_PROP]);
    };

    Latte.A = (function(Latte){

        function execArrows(as, v){
            return as.map(function(a){
                return a(v);
            });
        }

        function A(f){

            function A_(v){
                return f(v);
            }

            A_.always = function(g){
                return A(function(v){
                    return f(v).always(g);
                });
            };

            A_.next = function(g){
                return A(function(v){
                    return f(v).next(g);
                });
            };

            A_.fail = function(g){
                return A(function(v){
                    return f(v).fail(g);
                });
            };

            A_.bnd = function(g){
                return A(function(v){
                    return f(v).bnd(g);
                });
            };

            A_.lift = function(g){
                return A(function(v){
                    return f(v).lift(g);
                });
            };

            A_.raise = function(g){
                return A(function(v){
                    return f(v).raise(g);
                });
            };

            A_.radd = function(a){
                return A(function(v){
                    return f(v).bnd(function(v){
                        return a(v);
                    });
                });
            };

            A_.ladd = function(a){
                return a.radd(f);
            };

            A_.seq = function(as){
                return A.seq([f].concat(as));
            };

            return defineConstProp(A_, A_PROP, true);
        }

        A.seq = function(as){
            return A(function(v){
                return Latte.M.seq(execArrows(as, v));
            });
        };

        A.allseq = function(as){
            return A(function(v){
                return Latte.M.allseq(execArrows(as, v));
            });
        };

        A.fold = function(f, init, as){
            return A(function(v){
                return Latte.M.fold(f, init, execArrows(as, v));
            });
        };

        A.lift = function(f, as){
            return A(function(v){
                return Latte.M.lift(f, execArrows(as, v));
            });
        };

        return A;

    }(Latte));

    Latte.isA = function(v){
        return !!(isFunction(v) && v[A_PROP]);
    };

    return Latte;
}));