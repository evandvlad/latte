/**
 * Autor: Evstigneev Andrey
 * Date: 02.11.2014
 * Time: 22:22
 */

(function(global, initializer){

    global.Latte = initializer();
    global.Latte.version = '6.0.0';

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

        L_KEY = 'L',
        R_KEY = 'R',

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

    function lift(v){
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
        return Object.keys(ofrom || []).reduce(function(acc, prop){
            acc[prop] = ofrom[prop];
            return acc;
        }, oto);
    }

    function closure(f){
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

    function log(){
        console && isFunction(console.log) && console.log.apply(console, arguments);
    }

    function isValueWithProp(typechecker, key, v){
        return typechecker(v) && !!v[key];
    }

    function isNothing(v){
        return v === NOTHING;
    }

    function unpacker(f, tp){
        var sf = compose(f, tp ? Latte[tp] : id),
            vf = tp ? cond(Latte['is' + tp], f, noop) : f;
        
        return cond(Latte.isStream, meth('listen' + (tp || ''), sf), vf); 
    }

    function BuildStream(params){

        function Stream(executor, ctx){
            if(!(this instanceof Stream)){
                return new Stream(executor, ctx);
            }

            this[Latte._PROP_STREAM_STATE] = new Latte._State(bind(executor, ctx), params);
        }

        Stream.prototype.listen = function(f, ctx){
            this[Latte._PROP_STREAM_STATE].on(compose(bind(f, ctx), Latte.val));
            return this;
        };

        Stream.prototype.listenL = function(f, ctx){
            this[Latte._PROP_STREAM_STATE].on(cond(Latte.isL, compose(bind(f, ctx), Latte.val), noop));
            return this;
        };

        Stream.prototype.listenR = function(f, ctx){
            this[Latte._PROP_STREAM_STATE].on(cond(Latte.isR, compose(bind(f, ctx), Latte.val), noop));
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

        Stream.prototype.dip = function(f, ctx){
            return new this.constructor(function(c){
                this.listen(closure(bind(f, ctx, c))); 
            }, this);
        };

        Stream.prototype.dipL = function(f, ctx){
            return new this.constructor(function(c){
                this.listenL(closure(bind(f, ctx, c))).listenR(c); 
            }, this);
        };

        Stream.prototype.dipR = function(f, ctx){
            return new this.constructor(function(c){
                this.listenR(closure(bind(f, ctx, c))).listenL(c); 
            }, this);
        };

        Stream.prototype.debounce = function(t){
            return this.dip(debounce(t)); 
        };

        Stream.prototype.debounceL = function(t){
            return this.dipL(debounce(t)).fmapR(id); 
        };

        Stream.prototype.debounceR = function(t){
            return this.dipR(debounce(t)).fmapL(Latte.L); 
        };

        Stream.prototype.throttle = function(t){
            return this.dip(throttle(t));
        };

        Stream.prototype.throttleL = function(t){
            return this.dipL(throttle(t)).fmapR(id);
        };

        Stream.prototype.throttleR = function(t){
            return this.dipR(throttle(t)).fmapL(Latte.L);
        };

        Stream.prototype.any = function(ss){
            return this.constructor.any([this].concat(ss)); 
        };

        Stream.prototype.anyL = function(ss){
            return this.constructor.anyL([this].concat(ss)); 
        };

        Stream.prototype.anyR = function(ss){
            return this.constructor.anyR([this].concat(ss)); 
        };

        Stream.prototype.merge = function(ss){
            return this.constructor.merge([this].concat(ss));
        };

        Stream.prototype.mergeL = function(ss){
            return this.constructor.mergeL([this].concat(ss));
        };

        Stream.prototype.mergeR = function(ss){
            return this.constructor.mergeR([this].concat(ss));
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

        Stream.init = function(v){

        };

        Stream.any = function(ss){
            return new this(function(h){
                ss.forEach(unpacker(h));
            }); 
        };

        Stream.anyL = function(ss){
            return new this(function(h){
                ss.forEach(unpacker(h, L_KEY));
            });
        };

        Stream.anyR = function(ss){
            return new this(function(h){
                ss.forEach(unpacker(h, R_KEY));
            });
        };

        Stream.merge = function(ss){
            
        };
        
        Stream.mergeL = function(ss){
            
        };

        Stream.mergeR = function(ss){
            
        };

        Stream.fun = function(f, ctx){
            
        };

        Stream.funL = function(f, ctx){
            
        };

        Stream.funR = function(f, ctx){
            
        };

        Stream.gen = function(g, ctx){
            
        };

        Stream.genL = function(g, ctx){
            
        };

        Stream.genR = function(g, ctx){
            
        };

        Stream.shell = function(){

            return {

                set : function(v){

                },

                out : function(){
                    return true; 
                }
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

    Latte.extend = function(Stream, ext){
        var Ctor;

        ext = ext || {};

        Ctor = ext.hasOwnProperty('constructor') ?
            ext.constructor :
            function Ctor(executor, ctx){
                if(!(this instanceof Ctor)){
                    return new Ctor(executor, ctx);
                }

                Stream.call(this, executor, ctx);
            };

        Ctor.prototype = Object.create(Stream.prototype);
        Ctor.prototype.constructor = Ctor;
        mix(Ctor.prototype, ext);

        return mix(Ctor, Stream);
    };

    Latte._PROP_STREAM_STATE = '_____####![STREAM_STATE]'; 

    Latte._State = function(executor, params){
        this._params = params;
        this._queue = [];
        this._val = NOTHING;
        executor(bind(this.set, this));
    };

    Latte._State.prototype.on = function(f){
        this._queue && this._queue.push(f);
        !isNothing(this._val) && f(this._val);
        return this;
    };

    Latte._State.prototype.get = function(){
        return this._val;
    };

    Latte._State.prototype.set = function(v){
        if(isNothing(this._val) || !this._params.immutable){
            this._val = v;
            this._queue && this._queue.forEach(lift(this._val), this);
            this._params.immutable && (this._queue = null);
        }
        return this;
    };

    return Latte; 
}));