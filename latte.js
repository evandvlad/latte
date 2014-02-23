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
            version : '1.14.0'
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

    function mcreate(notifier, ext){

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
            },

            seq : function(ms){
                return this.constructor.seq([this].concat(ms || []));
            }
        };

        mix(M.prototype, ext);

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

        M.allseq = function(ms){
            return ms.length ? this(function(h){
                var mlen = ms.length,
                    acc = [];

                ms.forEach(function(m, i){
                    m.always(function(v){
                        acc[i] = v;

                        if(Object.keys(acc).length === mlen){
                            h(acc);
                            acc = [];
                        }
                    });
                });
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

        mix(M, ext);

        return M;
    }

    Latte.E = function(v){
        function E_(){
            return v;
        }

        E_[E_PROP] = true;

        return E_;
    };

    Latte.isE = function(v){
        return !!(isFunction(v) && v[E_PROP]);
    };

    Latte.M = (function(){

        var M = mcreate(function(ctor){
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

        msextend(M);
        M.prototype[M_PROP] = true;

        return M;
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
            }, {

                pseq : function(ss){
                    return this.constructor.pseq([this].concat(ss || []));
                },

                any : function(ss){
                    return this.constructor.any([this].concat(ss || []));
                }
            }),

            S_ = {

                allseq : function(ss){
                    return ss.length ? S(function(h){
                        var mlen = ss.length,
                            acc = [];

                        ss.forEach(function(s, i){
                            s.always(function(v){
                                acc[i] = v;
                                Object.keys(acc).length === mlen && h(acc);
                            });
                        });

                    }) : S(curryLift([]));
                },

                seq : function(){
                    return S.seq.apply(S_, arguments);
                }
            };

        msextend(S, {

            pallseq : S_.allseq,

            pseq : S_.seq,

            pfold : function(){
                return this.fold.apply(S_, arguments);
            },

            plift : function(){
                return this.lift.apply(S_, arguments);
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

        S.prototype[S_PROP] = true;

        return S;

    }());

    Latte.isS = function(v){
        return !!(isObject(v) && v[S_PROP]);
    };

    Latte.A = (function(Latte){

        function A(f){

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

            f.seq = function(as){
                return A.seq([this].concat(as || []));
            };

            f.radd = function(a){
                return this.bnd(a);
            };

            f.ladd = function(a){
                return a.radd(this);
            };

            f[A_PROP] = true;

            return f;
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

        PS.prototype[PS_PROP] = true;
        mix(PS, PS.prototype);
        PS.sbs = {};

        return PS;

    }());

    Latte.isPS = function(v){
        return !!((isObject(v) || isFunction(v)) && v[PS_PROP]);
    };

    return Latte;
}));