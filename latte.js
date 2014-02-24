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
            version : '1.15.0'
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

    function defineConstProp(o, prop, v){
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

        M.prototype = {

            constructor : M,

            always : function(f){
                this.notifier(f);
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
                    self.notifier(function(v){
                        !Latte.isE(v) ? f(v).always(c) : c(v);
                    });
                });
            },

            lift : function(f){
                var self = this;

                return new this.constructor(function(c){
                    self.notifier(function(v){
                        !Latte.isE(v) ? new self.constructor(function(h){
                            [h, c].forEach(curryLift(f(v)));
                        }) : c(v);
                    });
                });
            },

            raise : function(f){
                var self = this;

                return new this.constructor(function(c){
                    self.notifier(function(v){
                        Latte.isE(v) ? new self.constructor(function(h){
                            [h, c].forEach(curryLift(Latte.E(f(v))));
                        }) : c(v);
                    });
                });
            }
        };

        defineConstProp(M.prototype, mkey, true);

        return M;
    }

    function msextend(M, ext){

        M.seq = function(ms){
            return this.allseq(ms).lift(function(vs){
                return vs.reduce(function(acc, v){
                    return Latte.isE(acc) ? acc : (Latte.isE(v) ? v : (acc.push(v) && acc));
                }, []);
            });
        };

        M.allseq = allseqTmpl(true);

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

        mix(M, ext);

        return M;
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
        return defineConstProp(function E_(){
            return v;
        }, E_PROP, true);
    };

    Latte.isE = function(v){
        return !!(isFunction(v) && v[E_PROP]);
    };

    Latte.M = (function(){

        var M = mcreate(function(ctor){
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
        }, M_PROP);

        return msextend(M);
    }());

    Latte.Mv = function(v){
        return Latte.M(curryLift(v));
    };

    Latte.isM = function(v){
        return !!(isObject(v) && v[M_PROP]);
    };

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
                    throw Error('empty list');
                }

                return this(function(h){
                    ss.forEach(function(s){
                        s.always(h);
                    });
                });
            }
        });
    }());

    Latte.SH = (function(Latte){

        return mix(mcreate(function(ctor){
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

    }(Latte));

    Latte.isS = function(v){
        return !!(isObject(v) && v[S_PROP]);
    };

    Latte.A = (function(Latte){

        return mix(function A(f){

            f.always = function(g){
                return A(function(v){
                    return this(v).always(g);
                }.bind(this));
            };

            f.next = function(g){
                return A(function(v){
                    return this(v).next(g);
                }.bind(this));
            };

            f.fail = function(g){
                return A(function(v){
                    return this(v).fail(g);
                }.bind(this));
            };

            f.bnd = function(g){
                return A(function(v){
                    return this(v).bnd(g);
                }.bind(this));
            };

            f.lift = function(g){
                return A(function(v){
                    return this(v).lift(g);
                }.bind(this));
            };

            f.raise = function(g){
                return A(function(v){
                    return this(v).raise(g);
                }.bind(this));
            };

            f.radd = function(a){
                return this.bnd(a);
            };

            f.ladd = function(a){
                return a.radd(this);
            };

            return defineConstProp(f, A_PROP, true);
        }, {

            seq : function(as){
                return this(function(v){
                    return Latte.M.seq(as.map(curryLift(v)));
                });
            },

            allseq : function(as){
                return this(function(v){
                    return Latte.M.allseq(as.map(curryLift(v)));
                });
            },

            fold : function(f, init, as){
                return this(function(v){
                    return Latte.M.fold(f, init, as.map(curryLift(v)));
                });
            },

            lift : function(f, as){
                return this(function(v){
                    return Latte.M.lift(f, as.map(curryLift(v)));
                });
            }
        });
    }(Latte));

    Latte.Aloop = function(a, f){

        return function(v){
            return Latte.M(function(h){
                var na = a.next(function(vl){
                    f(vl).always(na);
                }).fail(h);

                na(v);
            });
        };
    };

    Latte.isA = function(v){
        return !!(isFunction(v) && v[A_PROP]);
    };

    Latte.PS = (function(){

        function PS(){
            if(!(this instanceof PS)){
                return new PS();
            }

            this.sbs = {};
        }

        PS.prototype = {

            constructor : PS,

            pub : function(e, v){
                return (this.sbs[e] || []).map(curryLift(v));
            },

            sub : function(e, f){
                (this.sbs[e] = this.sbs[e] || []).push(f);
                return this;
            },

            once : function(e, f){
                var self = this;

                this.sub(e, function _f(v){
                    self.unsub(e, _f);
                    return f(v);
                });

                return this;
            },

            unsub : function(e, f){
               this.sbs[e] = (this.sbs[e] || []).filter(function(c){
                   return c !== f;
               });

               return this;
            },

            unsuball : function(e){
                delete this.sbs[e];
                return this;
            }
        };

        defineConstProp(PS.prototype, PS_PROP, true);
        defineConstProp(PS, PS_PROP, true);
        defineConstProp(PS, 'sbs', {});

        return mix(PS, PS.prototype);
    }());

    Latte.isPS = function(v){
        return !!((isObject(v) || isFunction(v)) && v[PS_PROP]);
    };

    return Latte;
}));