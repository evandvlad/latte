/**
 * Autor: Evstigneev Andrey
 * Date: 02.11.2014
 * Time: 22:22
 */

'use strict';

const PROP_L = '_____####![L]';
const PROP_ISTREAM = '_____####![ISTREAM]';
const PROP_MSTREAM = '_____####![MSTREAM]';
const PROP_CALLBACK = '_____####![CALLBACK]';
const PROP_STREAM_STATE = '_____####![STREAM_STATE]';
const PROP_L_VALUE = 'value';

const NOTHING = { toString : () => 'NOTHING' };

let Latte = {};

function noop(){}

function id(value){
    return value;
}

function fconst(value){
    return () => value;
}

function bind(func, context, ...args){
    return (...adArgs) => func.apply(context, args.concat(adArgs));
}

function ap(value){
    return func => func(value);
}

function not(value){
    return !value;
}

function compose(oFunc, iFunc){
    return value => oFunc(iFunc(value));
}

function cond(cFunc, tFunc, fFunc){
    return value => cFunc(value) ? tFunc(value) : fFunc(value);
}

function when(cFunc, tFunc){
    return cond(cFunc, tFunc, id);
}

function prop(field){
    return obj => obj[field];
}

function meth(method, param){
    return obj => obj[method](param);
}

function mix(dest, source){
    return Object.keys(source).reduce((acc, key) => {
        acc[key] = source[key];
        return acc;
    }, dest);
}

function inherit(Parent, Child, ext){
    Child.prototype = Object.create(Parent.prototype);
    Child.prototype.constructor = Child;
    mix(Child.prototype, ext);
    return Child;
}

function susp(func){
    let fn = null;
    return value => {
        fn = fn || func();
        return fn(value); 
    }; 
}

function oDefineProp(obj, property, value){
    return Object.defineProperty(obj, property, {value});
}

function isObject(value){
    return Object.prototype.toString.call(value) === '[object Object]';
}

function isFunction(value){
    return Object.prototype.toString.call(value) === '[object Function]';
}

function stdamper(func){
     return callback => {
        let state = {/*value : undefined, */mark : null};

        return value => {
            state.value = value; 
            
            func(timeout => {
                return setTimeout(() => {
                    callback(state.value);
                    state.mark = null;
                }, timeout);
            }, state); 
        }; 
    };
}

function throttle(timeout){
    return stdamper((runner, state) => {
        if(state.mark === null){
            state.mark = runner(timeout);
        }
    });
}

function debounce(timeout){
    return stdamper((runner, state) => {
        if(state.mark){
            clearTimeout(state.mark);
        }
        
        state.mark = runner(timeout);
    });
}

function log(value){
    if(console && isFunction(console.log)){
        console.log('Latte log > ', value);
    }
}

function isNothing(value){
    return value === NOTHING;
}

function isValueWithProp(typechecker, key, value){
    return typechecker(value) && !!value[key];
}

function unpacker(func){
    return cond(Latte.isStream, meth('listen', func), func);
}

function condVal(leftFunc, rightFunc){
    return cond(Latte.isL, leftFunc, rightFunc);
}

class AbstractState {
    
    constructor(executor, params){
        this._params = params;
        this._queue = [];
        this._val = NOTHING;
        this._isInit = false;
        this._executor = executor;
    }
    
    on(func){
        if(this._queue){
            this._queue.push(func);
        }
        
        if(!isNothing(this._val)){
            func(this._val);
        }
        
        return this;
    }

    set(value){
        if(!this._isInit){
            return this;
        }
        
        if(isNothing(this._val) || !this._params.immutable){
            this._val = value;
            
            if(this._queue){
                this._queue.forEach(ap(this._val), this);
            }
            
            if(this._params.immutable){
                this._queue = null;
            }
        }
        
        return this;
    }

    get(){
        return this._val;
    }

    _init(){
        if(!this._isInit){
            this._isInit = true;
            this._executor(bind(this.set, this));
        }
        
        return this;
    }
}

class StateStrict extends AbstractState {
    
    constructor(...args){
        super(...args);
        this._init();
    }
}

class StateLazy extends AbstractState {
    
    on(...args){
        super.on(...args);
        setTimeout(bind(this._init, this), 0);
    }
}

function createStream(params){

    function Stream(executor, context){
        if(!(this instanceof Stream)){
            return new Stream(executor, context);
        }
        
        let state = new StateStrict(bind(executor, context), params);
        oDefineProp(this, PROP_STREAM_STATE, state);
    }

    Stream.prototype = {
        
        constructor : Stream,
        
        listen(func, context){
            this[PROP_STREAM_STATE].on(bind(func, context));
            return this;
        },
        
        listenL(func, context){
            this[PROP_STREAM_STATE].on(condVal(bind(func, context), noop));
            return this;
        },
        
        listenR(func, context){
            this[PROP_STREAM_STATE].on(condVal(noop, bind(func, context)));
            return this;
        },

        then(func, context){
            return new this.constructor(continuator => {
                this.listen(compose(unpacker(continuator), bind(func, context)));
            });
        },

        thenL(func, context){
            return new this.constructor(continuator => {
                this.listen(condVal(compose(unpacker(continuator), bind(func, context)), continuator));
            });
        },

        thenR(func, context){
            return new this.constructor(continuator => {
                this.listen(condVal(continuator, compose(unpacker(continuator), bind(func, context))));
            });
        },

        fmap(func, context){
            return new this.constructor(continuator => {
                this.listen(compose(continuator, bind(func, context)));
            });
        },

        fmapL(func, context){
            return new this.constructor(continuator => {
                this.listen(condVal(compose(continuator, bind(func, context)), continuator));
            });
        },

        fmapR(func, context){
            return new this.constructor(continuator => {
                this.listen(condVal(continuator, compose(continuator, bind(func, context))));
            });
        },

        pass(value){
            return this.then(fconst(value)); 
        },

        passL(value){
            return this.thenL(fconst(value)); 
        },

        passR(value){
            return this.thenR(fconst(value)); 
        },

        when(func, context){
            return new this.constructor(continuator => {
                this.listen(when(bind(func, context), continuator));
            }); 
        },

        whenL(func, context){
            return new this.constructor(continuator => {
                this.listen(condVal(when(bind(func, context), continuator), continuator));
            }); 
        },

        whenR(func, context){
            return new this.constructor(continuator => {
                this.listen(condVal(continuator, when(bind(func, context), continuator)));
            }); 
        },

        unless(func, context){
            return this.when(compose(not, bind(func, context)));
        },

        unlessL(func, context){
            return this.whenL(compose(not, bind(func, context)));
        },

        unlessR(func, context){
            return this.whenR(compose(not, bind(func, context)));
        },

        cdip(func, context){
            return new this.constructor(continuator => {
                this.listen(susp(bind(func, context, continuator))); 
            });
        },

        cdipL(func, context){
            return new this.constructor(continuator => {
                this.listen(condVal(susp(bind(func, context, continuator)), continuator)); 
            });
        },

        cdipR(func, context){
            return new this.constructor(continuator => {
                this.listen(condVal(continuator, susp(bind(func, context, continuator)))); 
            });
        },
        
        fdip(func, context){
            return this.then(susp(bind(func, context)));
        },
        
        fdipL(func, context){
            return this.thenL(susp(bind(func, context)));
        },
        
        fdipR(func, context){
            return this.thenR(susp(bind(func, context)));
        },

        debounce(timeout){
            return this.cdip(debounce(timeout)); 
        },

        debounceL(timeout){
            return this.cdipL(debounce(timeout)); 
        },

        debounceR(timeout){
            return this.cdipR(debounce(timeout)); 
        },

        throttle(timeout){
            return this.cdip(throttle(timeout));
        },

        throttleL(timeout){
            return this.cdipL(throttle(timeout));
        },

        throttleR(timeout){
            return this.cdipR(throttle(timeout));
        },

        log(){
            return this.listen(log); 
        },

        logL(){
            return this.listenL(log); 
        },

        logR(){
            return this.listenR(log); 
        },

        any(streams){
            return this.constructor.any([this].concat(streams)); 
        },

        merge(streams){
            return this.constructor.merge([this].concat(streams));
        } 
    };

    Stream.any = function(streams){
        return new this(compose(bind(streams.forEach, streams), unpacker));
    };
    
    Stream.merge = function(streams){
        let len = streams.length;

        return new this(len ? handler => {
            streams.reduce((acc, stream, index) => {
                unpacker(value => {
                    acc[index] = value;
                    
                    if(Object.keys(acc).length === len){
                        handler(acc.some(Latte.isL) ? Latte.L(acc.slice()) : acc.slice());
                    }
                })(stream);
                return acc;
            }, []);
        } : ap([]));
    };
    
    Stream.pack = function(value){
        return new this(ap(value));
    };
    
    Stream.never = function(){
        return new this(noop);
    };
    
    Stream.lazy = function(executor, context){
        let instance = Object.create(Stream.prototype),
            state = new StateLazy(bind(executor, context), params);
        
        return oDefineProp(instance, PROP_STREAM_STATE, state);
    };

    Stream.shell = function(){
        let stream = this.never();
        
        stream.set = function(value){
            this[PROP_STREAM_STATE].set(value);
            return this;
        };
        
        stream.get = function(defaultValue){
            return when(isNothing, fconst(defaultValue))(this[PROP_STREAM_STATE].get());
        };
        
        return {
            set : bind(stream.set, stream),
            get : bind(stream.get, stream),
            out : fconst(new this(stream.listen, stream))
        };
    };
    
    oDefineProp(Stream.prototype, params.key, true);

    return Stream;
}

Latte.IStream = createStream({immutable : true, key : PROP_ISTREAM});
Latte.MStream = createStream({immutable : false, key : PROP_MSTREAM});

Latte.isIStream = bind(isValueWithProp, null, isObject, PROP_ISTREAM);
Latte.isMStream = bind(isValueWithProp, null, isObject, PROP_MSTREAM);

Latte.isStream = function(value){
    return Latte.isIStream(value) || Latte.isMStream(value);
}; 

Latte.L = function(value){
    return oDefineProp(oDefineProp({}, PROP_L_VALUE, value), PROP_L, true);
};

Latte.R = id;
Latte.isL = bind(isValueWithProp, null, isObject, PROP_L);
Latte.isR = compose(not, Latte.isL);
Latte.val = when(Latte.isL, prop(PROP_L_VALUE));

Latte.callback = function(func, context){
    let shell = Latte.MStream.shell();
    
    return oDefineProp(function(){
        shell.set(func.apply(context || this, arguments));
        return shell.get();
    }, PROP_CALLBACK, shell.out());
};

Latte.isCallback = bind(isValueWithProp, null, isFunction, PROP_CALLBACK);

Latte.fun = function(func, context){
    
    return function(...args){
        let result = func.apply(context, args);
            
        return new Latte.MStream(handler => {
            let callbacks = args.filter(Latte.isCallback);
            
            if(callbacks.length){
                Latte.MStream.any(callbacks.map(prop(PROP_CALLBACK))).listen(handler);
            }
            else{
                handler(result);
            }
        });
    };
};

Latte.gen = function(generator, context){
    
    return function(...args){
        
        return new Latte.IStream(handler => {
            (function iterate(gen, value){
                let state = gen.next(value);
                unpacker(state.done ? handler : cond(Latte.isL, handler, bind(iterate, null, gen)))(state.value);
            }(generator.apply(context, args)));
        });
    };
};

Latte.extend = function(Stream, ext = {}){
    let Ctor = ext.hasOwnProperty('constructor') ? ext.constructor : function Ctor(executor, context){
        if(!(this instanceof Ctor)){
            return new Ctor(executor, context);
        }

        Stream.call(this, executor, context);
    };

    return mix(inherit(Stream, Ctor, ext), Stream);
};

export default Latte; 
