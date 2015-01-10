/**
 * Autor: Evstigneev Andrey
 * Date: 02.11.2014
 * Time: 22:22
 */

(function(global, initializer){

    global.Latte = initializer();
    global.Latte.version = '6.5.6';

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
        PROP_STREAM_STATE = '_____####![STREAM_STATE]',

        NOTHING = new String('NOTHING'),
        PROP_L_VALUE = 'value',

        toString = Function.prototype.call.bind(Object.prototype.toString),
        aslice = Function.prototype.call.bind(Array.prototype.slice);

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
        var args = aslice(arguments, 2);
        return function(){
            return f.apply(ctx, args.concat(aslice(arguments)));
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
    
    function when(f, g){
        return cond(f, g, id);
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
        return Object.keys(ofrom).reduce(function(acc, p){
            acc[p] = ofrom[p];
            return acc;
        }, oto);
    }
    
    function inherit(P, C, ext){
        C.prototype = Object.create(P.prototype);
        C.prototype.constructor = C;
        mix(C.prototype, ext || {});
        return C;
    }

    function susp(f){
        var fn = null;
        return function(v){
            fn = fn || f();
            return fn(v); 
        }; 
    }
    
    function oDefineProp(o, p, v){
        return Object.defineProperty(o, p, {value : v});
    }

    function isObject(v){
        return toString(v) === '[object Object]';
    }

    function isFunction(v){
        return toString(v) === '[object Function]';
    }
    
    function asize(a){
        return Object.keys(a).length;
    }

    function stdamper(f){
         return function(c){
            var st = {v : undefined, mark : null};

            return function(v){
                st.v = v; 
                
                f(function(t){
                    return setTimeout(function(){
                        c(st.v);
                        st.mark = null;
                    }, t);
                }, st); 
            }; 
        };
    }

    function throttle(t){
        return stdamper(function(runtf, st){
            st.mark === null && (st.mark = runtf(t));
        });
    }

    function debounce(t){
        return stdamper(function(runtf, st){
            st.mark && clearTimeout(st.mark);
            st.mark = runtf(t);
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
    
    function condVal(lf, rf){
        return cond(Latte.isL, lf, rf);
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
    
    State.prototype.get = function(){
        return this._val;
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
            State.prototype.on.apply(this, arguments);
            setTimeout(bind(this._init, this), 0);
            return this;
        }
    });
    
    function BuildStreamImpl(self, St, executor, ctx, params){
        return oDefineProp(self, PROP_STREAM_STATE, new St(bind(executor, ctx), params));
    }

    function BuildStream(params){

        function Stream(executor, ctx){
            if(!(this instanceof Stream)){
                return new Stream(executor, ctx);
            }

            BuildStreamImpl(this, StateStrict, executor, ctx, params); 
        }

        Stream.prototype.listen = function(f, ctx){
            this[PROP_STREAM_STATE].on(bind(f, ctx));
            return this;
        };

        Stream.prototype.listenL = function(f, ctx){
            this[PROP_STREAM_STATE].on(condVal(bind(f, ctx), noop));
            return this;
        };

        Stream.prototype.listenR = function(f, ctx){
            this[PROP_STREAM_STATE].on(condVal(noop, bind(f, ctx)));
            return this;
        };

        Stream.prototype.then = function(f, ctx){
            return new this.constructor(function(c){
                this.listen(compose(unpacker(c), bind(f, ctx)));
            }, this);
        };

        Stream.prototype.thenL = function(f, ctx){
            return new this.constructor(function(c){
                this.listen(condVal(compose(unpacker(c), bind(f, ctx)), c));
            }, this);
        };

        Stream.prototype.thenR = function(f, ctx){
            return new this.constructor(function(c){
                this.listen(condVal(c, compose(unpacker(c), bind(f, ctx))));
            }, this);
        };

        Stream.prototype.fmap = function(f, ctx){
            return new this.constructor(function(c){
                this.listen(compose(c, bind(f, ctx)));
            }, this);
        };

        Stream.prototype.fmapL = function(f, ctx){
            return new this.constructor(function(c){
                this.listen(condVal(compose(c, bind(f, ctx)), c));
            }, this);
        };

        Stream.prototype.fmapR = function(f, ctx){
            return new this.constructor(function(c){
                this.listen(condVal(c, compose(c, bind(f, ctx))));
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
                this.listen(when(bind(f, ctx), c));
            }, this); 
        };

        Stream.prototype.whenL = function(f, ctx){
            return new this.constructor(function(c){
                this.listen(condVal(when(bind(f, ctx), c), c));
            }, this); 
        };

        Stream.prototype.whenR = function(f, ctx){
            return new this.constructor(function(c){
                this.listen(condVal(c, when(bind(f, ctx), c)));
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
                this.listen(susp(bind(f, ctx, c))); 
            }, this);
        };

        Stream.prototype.cdipL = function(f, ctx){
            return new this.constructor(function(c){
                this.listen(condVal(susp(bind(f, ctx, c)), c)); 
            }, this);
        };

        Stream.prototype.cdipR = function(f, ctx){
            return new this.constructor(function(c){
                this.listen(condVal(c, susp(bind(f, ctx, c)))); 
            }, this);
        };
        
        Stream.prototype.fdip = function(f, ctx){
            return this.then(susp(bind(f, ctx)));
        };
        
        Stream.prototype.fdipL = function(f, ctx){
            return this.thenL(susp(bind(f, ctx)));
        };
        
        Stream.prototype.fdipR = function(f, ctx){
            return this.thenR(susp(bind(f, ctx)));
        };

        Stream.prototype.debounce = function(t){
            return this.cdip(debounce(t)); 
        };

        Stream.prototype.debounceL = function(t){
            return this.cdipL(debounce(t)); 
        };

        Stream.prototype.debounceR = function(t){
            return this.cdipR(debounce(t)); 
        };

        Stream.prototype.throttle = function(t){
            return this.cdip(throttle(t));
        };

        Stream.prototype.throttleL = function(t){
            return this.cdipL(throttle(t));
        };

        Stream.prototype.throttleR = function(t){
            return this.cdipR(throttle(t));
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
            return new this(compose(bind(ss.forEach, ss), unpacker));
        };
        
        Stream.merge = function(ss){
            var len = ss.length;

            return new this(len ? function(h){
                ss.reduce(function(acc, s, i){
                    unpacker(function(v){
                        acc[i] = v;
                        asize(acc) === len && h(acc.some(Latte.isL) ? Latte.L(acc.slice()) : acc.slice());
                    })(s);
                    return acc;
                }, []);
            } : ap([]));
        };
        
        Stream.pack = function(v){
            return new this(ap(v));
        };
        
        Stream.never = function(){
            return new this(noop);
        };
        
        Stream.lazy = function(executor, ctx){
            return BuildStreamImpl(Object.create(Stream.prototype), StateLazy, executor, ctx, params); 
        };

        Stream.shell = function(){
            var s = this.never();
            
            s.set = function(v){
                this[PROP_STREAM_STATE].set(v);
                return this;
            };
            
            s.get = function(dv){
                return when(isNothing, fconst(dv))(this[PROP_STREAM_STATE].get());
            };
            
            return {
                set : bind(s.set, s),
                get : bind(s.get, s),
                out : fconst(new this(s.listen, s))
            };
        };
        
        Stream.shellify = function(s){
            var sh = this.shell();
            s.listen(sh.set, sh);
            return sh;
        };
        
        oDefineProp(Stream.prototype, params.key, true);

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
        return oDefineProp(oDefineProp({}, PROP_L_VALUE, v), PROP_L, true);
    };

    Latte.R = id;
    Latte.isL = bind(isValueWithProp, null, isObject, PROP_L);
    Latte.isR = compose(not, Latte.isL);
    Latte.val = when(Latte.isL, prop(PROP_L_VALUE));
    
    Latte.callback = function(f, ctx){
        var shell = Latte.MStream.shell();
        return oDefineProp(function(){
            shell.set(f.apply(ctx || this, arguments));
            return shell.get();
        }, PROP_CALLBACK, shell.out());
    };

    Latte.isCallback = bind(isValueWithProp, null, isFunction, PROP_CALLBACK);
    
    Latte.fun = function(f, ctx){
        return function(){
            var args = aslice(arguments),
                r = f.apply(ctx, args);
                
            return new Latte.MStream(function(h){
                var cbs = args.filter(Latte.isCallback);
                cbs.length ? Latte.MStream.any(cbs.map(prop(PROP_CALLBACK))).listen(h) : h(r);
            });
        };
    };
    
    Latte.gen = function(g, ctx){
        return function(){
            var args = aslice(arguments);
            return new Latte.IStream(function(h){
                (function iterate(gen, val){
                    var st = gen.next(val);
                    unpacker(st.done ? h : cond(Latte.isL, h, bind(iterate, null, gen)))(st.value);
                }(g.apply(ctx, args)));
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
    
    Latte.puller = function(s){
        var fv = NOTHING,
            q = [];
            
        function createQItem(f, ctx){
            return {
                shell : Latte.IStream.shell(), 
                filter : f ? bind(f, ctx) : fconst(true)
            };
        }
            
        s.listen(function(v){
            q.length && q[0].filter(v) ? q.shift().shell.set(v) : (fv = v);
        });
        
        return {
            
            pull : function(f, ctx){
                var qitem = createQItem(f, ctx);
                !isNothing(fv) && qitem.filter(fv) ? (qitem.shell.set(fv), (fv = NOTHING)) : q.push(qitem);
                return qitem.shell.out();
            },
            
            apull : function(f, ctx){
                var qitem = createQItem(f, ctx);
                fv = NOTHING;
                q.push(qitem);
                return qitem.shell.out();
            }
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

    return Latte; 
}));