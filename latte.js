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

        Latte = {
            version : '1.10.0'
        };

    function defineConstProp(o, prop, v){
        return Object.defineProperty(o, prop, {
            enumerable : false,
            configurable : false,
            writable : false,
            value : v
        });
    }

    function curryLift(v){
        return function(f){
            return f(v);
        };
    }

    function isFunction(v){
        return Object.prototype.toString.call(v) === '[object Function]';
    }

    function MCreator(fstate){

        function M(ctor){
            if(!(this instanceof M)){
                return new M(ctor);
            }

            this.st = fstate(ctor);
        }

        M.prototype = {

            constructor : M,

            always : function(f){
                this.st(f);
                return this;
            },

            next : function(f){
                return this.always(function(v){
                    !Latte.isE(v) && f(v);
                });
            },

            fail : function(f){
                return this.always(function(v){
                    Latte.isE(v) && f(v);
                });
            },

            bnd : function(f){
                var self = this;

                return new this.constructor(function(c){
                    self.st(function(v){
                        !Latte.isE(v) ? f(v).always(c) : c(v);
                    });
                });
            },

            lift : function(f){
                var self = this;

                return new this.constructor(function(c){
                    self.st(function(v){
                        !Latte.isE(v) ? new self.constructor(function(h){
                            [h, c].forEach(curryLift(f(v)));
                        }) : c(v);
                    });
                });
            },

            raise : function(f){
                var self = this;

                return new this.constructor(function(c){
                    self.st(function(v){
                        Latte.isE(v) ? new self.constructor(function(h){
                            [h, c].forEach(curryLift(Latte.E(f(v))));
                        }) : c(v);
                    });
                });
            },

            seq : function(ms){
                return this.constructor.seq([this].concat(ms || []));
            }
        };

        M.seq = function(ms){
            return this.allseq(ms).lift(function(vs){
                return vs.reduce(function(acc, v){
                    return Latte.isE(acc) ? acc : (Latte.isE(v) ? v : (acc.push(v) && acc));
                }, []);
            });
        };

        M.allseq = function(ms){
            var mlen = ms.length,
                tick = 0;

            return mlen ? this(function(h){
                ms.reduce(function(acc, m, i){
                    m.always(function(v){
                        acc[i] = v;

                        if(++tick === mlen){
                            h(acc);
                            tick = 0;
                        }
                    });

                    return acc;
                }, []);
            }) : this(curryLift([]));
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

        return M;
    }

    Latte.E = function(v){
        return defineConstProp(function E_(){
            return v;
        }, E_PROP, true);
    };

    Latte.isE = function(v){
        return !!(isFunction(v) && v[E_PROP]);
    };

    Latte.M = (function(){

        var M = MCreator(function(ctor){
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
        });

        defineConstProp(M.prototype, M_PROP, true);

        return M;

    }());

    Latte.Mv = function(v){
        return Latte.M(curryLift(v));
    };

    Latte.isM = function(v){
        return !!(typeof v === 'object' && v && v[M_PROP]);
    };

    Latte.S = (function(){

        var S = MCreator(function(ctor){
            var cbs = [];

            ctor(function(v){
                cbs.forEach(curryLift(v));
            });

            return function(f){
                cbs.push(f);
            };
        });

        defineConstProp(S.prototype, S_PROP, true);

        return S;

    }());

    Latte.isS = function(v){
        return !!(typeof v === 'object' && v && v[S_PROP]);
    };

    Latte.A = (function(Latte){

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
                    return f(v).bnd(a);
                });
            };

            A_.ladd = function(a){
                return a.radd(f);
            };

            A_.seq = function(as){
                return A.seq([f].concat(as || []));
            };

            return defineConstProp(A_, A_PROP, true);
        }

        A.seq = function(as){
            return this(function(v){
                return Latte.M.seq(as.map(curryLift(v)));
            });
        };

        A.allseq = function(as){
            return this(function(v){
                return Latte.M.allseq(as.map(curryLift(v)));
            });
        };

        A.fold = function(f, init, as){
            return this(function(v){
                return Latte.M.fold(f, init, as.map(curryLift(v)));
            });
        };

        A.lift = function(f, as){
            return this(function(v){
                return Latte.M.lift(f, as.map(curryLift(v)));
            });
        };

        return A;

    }(Latte));

    Latte.isA = function(v){
        return !!(isFunction(v) && v[A_PROP]);
    };

    return Latte;
}));