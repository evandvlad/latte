/**
 * Autor: Evstigneev Andrey
 * Date: 02.11.2014
 * Time: 22:22
 */

(function(global, initializer){

    global.Latte = initializer();
    global.Latte.version = '6.2.0';

    if(typeof module !== 'undefined' && module.exports){
        module.exports = global.Latte;
    }

}(this, function(){

    'use strict';

    var Latte = {},

        PROP_L = '_____####![L]',
        PROP_ISTREAM = '_____####![ISTREAM]',
        PROP_MSTREAM = '_____####![MSTREAM]',
        PROP_CALLBACK = '_____####![CALLBACK]',

        NOTHING = new String('NOTHING'),
        PROP_L_VALUE = 'value',

        toString = Object.prototype.toString,
        aslice = Array.prototype.slice;

    function noop(){}

    function id(v){
        return v;
    }

    function fconst(v){
        return function(){
            return v;
        };
    }

    function bind(f, ctx){
        var args = aslice.call(arguments, 2);
        return function(){
            return f.apply(ctx, args.concat(aslice.call(arguments)));
        };
    }

    function ap(v){
        return function(f){
            return f(v);
        };
    }

    function not(v){
        return !v;
    }

    function compose(f, g){
        return function(v){
            return f(g(v));
        };
    }

    function cond(f, g, h){
        return function(v){
            return f(v) ? g(v) : h(v);
        };
    }

    function prop(p){
        return function(o){
            return o[p];
        };
    }

    function meth(m, v){
        return function(o){
            return o[m](v); 
        };
    }
    
    function mix(oto, ofrom){
        return Object.keys(ofrom).reduce(function(acc, prop){
            acc[prop] = ofrom[prop];
            return acc;
        }, oto);
    }
    
    function inherit(P, C, ext){
        C.prototype = Object.create(P.prototype);
        C.prototype.constructor = C;
        mix(C.prototype, ext || {});
        return C;
    }

    function thunk(f){
        var fn = null;
        return function(v){
            fn = fn || f();
            return fn(v); 
        }; 
    }

    function isObject(v){
        return toString.call(v) === '[object Object]';
    }

    function isFunction(v){
        return toString.call(v) === '[object Function]';
    }

    function stdamper(f){
         return function(c){
            var st = {v : undefined, mark : null};

            return function(v){
                st.v = v; 
                f(c, st); 
            }; 
        };
    }

    function throttle(t){
        return stdamper(function(c, st){
            if(st.mark === null){
                st.mark = setTimeout(function(){
                    c(st.v);
                    st.mark = null;
                }, t);
            }
        });
    }

    function debounce(t){
        return stdamper(function(c, st){
            st.mark && clearTimeout(st.mark);
            st.mark = setTimeout(function(){
                c(st.v);
                st.mark = null;
            }, t);
        });
    }

    function log(v){
        console && isFunction(console.log) && console.log('Latte log > ', v);
    }

    function isValueWithProp(typechecker, key, v){
        return typechecker(v) && !!v[key];
    }

    function isNothing(v){
        return v === NOTHING;
    }

    function unpacker(f){
        return cond(Latte.isStream, meth('listen', f), f);
    }
    
    function State(executor, params){
        this._params = params;
        this._queue = [];
        this._val = NOTHING;
        this._isInit = false;
        this._executor = executor;
    };
    
    State.prototype.on = function(f){
        this._queue && this._queue.push(f);
        !isNothing(this._val) && f(this._val);
        return this;
    };

    State.prototype.set = function(v){
        if(!this._isInit){
            return this;
        }
        
        if(isNothing(this._val) || !this._params.immutable){
            this._val = v;
            this._queue && this._queue.forEach(ap(this._val), this);
            this._params.immutable && (this._queue = null);
        }
        
        return this;
    };
    
     State.prototype._init = function(){
        if(!this._isInit){
            this._isInit = true;
            this._executor(bind(this.set, this));
        }
        return this;
    };
    
    function StateStrict(){
        State.apply(this, arguments);
        this._init();
    }
    
    inherit(State, StateStrict);
    
    function StateLazy(){
        State.apply(this, arguments);
    }
    
    inherit(State, StateLazy, {
        on : function(){
            this._init();
            State.prototype.on.apply(this, arguments);
            return this;
        }
    });

    function BuildStream(params){

        function Stream(executor, ctx){
            if(!(this instanceof Stream)){
                return new Stream(executor, ctx);
            }

            Object.defineProperty(this, Latte._PROP_STREAM_STATE, {
                value : new StateStrict(bind(executor, ctx), params)
            });
        }

        Stream.prototype.listen = function(f, ctx){
            this[Latte._PROP_STREAM_STATE].on(bind(f, ctx));
            return this;
        };

        Stream.prototype.listenL = function(f, ctx){
            this[Latte._PROP_STREAM_STATE].on(cond(Latte.isL, bind(f, ctx), noop));
            return this;
        };

        Stream.prototype.listenR = function(f, ctx){
            this[Latte._PROP_STREAM_STATE].on(cond(Latte.isL, noop, bind(f, ctx)));
            return this;
        };

        Stream.prototype.then = function(f, ctx){
            return new this.constructor(function(c){
                this.listen(compose(unpacker(c), bind(f, ctx)));
            }, this);
        };

        Stream.prototype.thenL = function(f, ctx){
            return new this.constructor(function(c){
                this.listenL(compose(unpacker(c), bind(f, ctx))).listenR(c);
            }, this);
        };

        Stream.prototype.thenR = function(f, ctx){
            return new this.constructor(function(c){
                this.listenR(compose(unpacker(c), bind(f, ctx))).listenL(c);
            }, this);
        };

        Stream.prototype.fmap = function(f, ctx){
            return new this.constructor(function(c){
                this.listen(compose(c, bind(f, ctx)));
            }, this);
        };

        Stream.prototype.fmapL = function(f, ctx){
            return new this.constructor(function(c){
                this.listenL(compose(c, bind(f, ctx))).listenR(c);
            }, this);
        };

        Stream.prototype.fmapR = function(f, ctx){
            return new this.constructor(function(c){
                this.listenR(compose(c, bind(f, ctx))).listenL(c);
            }, this);
        };

        Stream.prototype.pass = function(v){
            return this.then(fconst(v)); 
        };

        Stream.prototype.passL = function(v){
            return this.thenL(fconst(v)); 
        };

        Stream.prototype.passR = function(v){
            return this.thenR(fconst(v)); 
        };

        Stream.prototype.when = function(f, ctx){
            return new this.constructor(function(c){
                this.listen(cond(bind(f, ctx), c, noop));
            }, this); 
        };

        Stream.prototype.whenL = function(f, ctx){
            return new this.constructor(function(c){
                this.listenL(cond(bind(f, ctx), c, noop)).listenR(c);
            }, this); 
        };

        Stream.prototype.whenR = function(f, ctx){
            return new this.constructor(function(c){
                this.listenR(cond(bind(f, ctx), c, noop)).listenL(c);
            }, this); 
        };

        Stream.prototype.unless = function(f, ctx){
            return this.when(compose(not, bind(f, ctx)));
        };

        Stream.prototype.unlessL = function(f, ctx){
            return this.whenL(compose(not, bind(f, ctx)));
        };

        Stream.prototype.unlessR = function(f, ctx){
            return this.whenR(compose(not, bind(f, ctx)));
        };

        Stream.prototype.cdip = function(f, ctx){
            return new this.constructor(function(c){
                this.listen(thunk(bind(f, ctx, c))); 
            }, this);
        };

        Stream.prototype.cdipL = function(f, ctx){
            return new this.constructor(function(c){
                this.listenL(thunk(bind(f, ctx, c))).listenR(c); 
            }, this);
        };

        Stream.prototype.cdipR = function(f, ctx){
            return new this.constructor(function(c){
                this.listenR(thunk(bind(f, ctx, c))).listenL(c); 
            }, this);
        };
        
        Stream.prototype.fdip = function(f, ctx){
            return this.then(thunk(bind(f, ctx)));
        };
        
        Stream.prototype.fdipL = function(f, ctx){
            return this.thenL(thunk(bind(f, ctx)));
        };
        
        Stream.prototype.fdipR = function(f, ctx){
            return this.thenR(thunk(bind(f, ctx)));
        };

        Stream.prototype.debounce = function(t){
            return this.cdip(debounce(t)); 
        };

        Stream.prototype.debounceL = function(t){
            return this.cdipL(debounce(t)).fmapR(id); 
        };

        Stream.prototype.debounceR = function(t){
            return this.cdipR(debounce(t)).fmapL(id); 
        };

        Stream.prototype.throttle = function(t){
            return this.cdip(throttle(t));
        };

        Stream.prototype.throttleL = function(t){
            return this.cdipL(throttle(t)).fmapR(id);
        };

        Stream.prototype.throttleR = function(t){
            return this.cdipR(throttle(t)).fmapL(id);
        };

        Stream.prototype.log = function(){
            return this.listen(log); 
        };

        Stream.prototype.logL = function(){
            return this.listenL(log); 
        };

        Stream.prototype.logR = function(){
            return this.listenR(log); 
        };

        Stream.prototype.any = function(ss){
            return this.constructor.any([this].concat(ss)); 
        };

        Stream.prototype.merge = function(ss){
            return this.constructor.merge([this].concat(ss));
        };

        Stream.any = function(ss){
            return new this(function(h){
                ss.forEach(unpacker(h));
            }); 
        };

        Stream.merge = (function(isResetAcc){
            return function(xs){
                var len = xs.length;

                return new this(len ? function(h){
                    var acc = [];

                    xs.forEach(function(x, i){
                        unpacker(function(v){
                            acc[i] = v;

                            if(Object.keys(acc).length === len){
                                h(acc.some(Latte.isL) ? 
                                    Latte.L(acc.concat()) : 
                                    acc.concat()
                                );
                                isResetAcc && (acc = []);
                            }
                        })(x);
                    });
                } : ap([]));
            };
        }(params.immutable));
        
        Stream.pack = function(v){
            return new this(ap(v));
        };
        
        Stream.never = function(){
            return new this(noop);
        };
        
        Stream.lazy = function(executor, ctx){
            var inst = Object.create(Stream.prototype);
            
            Object.defineProperty(inst, Latte._PROP_STREAM_STATE, {
                value : new StateLazy(bind(executor, ctx), params)
            });
            
            return inst;
        };

        Stream.shell = function(){
            var s = this.never();
            
            s.set = function(v){
                this[Latte._PROP_STREAM_STATE].set(v);
                return this;
            };
                        
            return {
                set : bind(s.set, s),
                out : fconst(new this(s.listen, s))
            };
        };

        Object.defineProperty(Stream.prototype, params.key, {value : true});

        return Stream;
    }

    Latte.IStream = BuildStream({immutable : true, key : PROP_ISTREAM});
    Latte.MStream = BuildStream({immutable : false, key : PROP_MSTREAM});

    Latte.isIStream = bind(isValueWithProp, null, isObject, PROP_ISTREAM);
    Latte.isMStream = bind(isValueWithProp, null, isObject, PROP_MSTREAM);

    Latte.isStream = function(v){
        return Latte.isIStream(v) || Latte.isMStream(v);
    }; 

    Latte.L = function(v){
        return Object.defineProperty(
            Object.defineProperty({}, PROP_L_VALUE, {value : v}), 
            PROP_L, 
            {value : true}
        );
    };

    Latte.R = id;
    Latte.isL = bind(isValueWithProp, null, isObject, PROP_L);
    Latte.isR = compose(not, Latte.isL);
    Latte.val = cond(Latte.isL, prop(PROP_L_VALUE), id);

    Latte.callback = function(f, ctx){
        var shell = Latte.MStream.shell();

        return Object.defineProperty(function(){
            var r = f.apply(ctx || this, arguments);
            shell.set(r);
            return r;
        }, PROP_CALLBACK, {value : shell.out()});
    };

    Latte.isCallback = bind(isValueWithProp, null, isFunction, PROP_CALLBACK);
    
    Latte.fun = function(f, ctx){
        return function(){
            var args = aslice.call(arguments),
                cbs = args.filter(Latte.isCallback),
                r = f.apply(ctx, args);
                
            return new Latte.MStream(function(h){
                cbs.length ? Latte.MStream.any(cbs.map(prop(PROP_CALLBACK))).listen(h) : h(r);
            });
        };
    };
    
    Latte.gen = function(g, ctx){
        return function(){
            var args = aslice.call(arguments);
            
            return new Latte.IStream(function(h){
                var gen = g.apply(ctx, args);
                (function iterate(val){
                    var st = gen.next(val);
                    unpacker(st.done ? h : cond(Latte.isL, h, iterate))(st.value);
                }());        
            });
        };
    };
    
    Latte.recur = function(f, ctx){
        var s = Latte.MStream.shell();
        
        function callf(v){
            setTimeout(function(){
                f.call(ctx, callf, v).listen(s.set, s);
            }, 0);
        }
        
        return function(v){
            callf(v);
            return s.out();
        };
    };
    
    Latte.extend = function(Stream, ext){
        var Ctor = (ext || {}).hasOwnProperty('constructor') ? ext.constructor : function Ctor(executor, ctx){
            if(!(this instanceof Ctor)){
                return new Ctor(executor, ctx);
            }

            Stream.call(this, executor, ctx);
        };

        return mix(inherit(Stream, Ctor, ext), Stream);
    };

    Latte._PROP_STREAM_STATE = '_____####![STREAM_STATE]'; 

    return Latte; 
}));