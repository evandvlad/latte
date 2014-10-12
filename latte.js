/**
 * Autor: Evstigneev Andrey
 * Date: 30.09.2014
 * Time: 22:22
 */

(function(global, initializer){

    global.Latte = initializer();

    if(typeof module !== 'undefined' && module.exports){
        module.exports = global.Latte;
    }

}(this, function(){

    'use strict';

    var Latte = {},

        KEY_E = '_____####![E]',
        KEY_PROMISE = '_____####![PROMISE]',
        KEY_STREAM = '_____####![STREAM]',

        aslice = Array.prototype.slice,
        toString = Object.prototype.toString;

    function noop(){}

    function fconst(v){
        return function(){
            return v;
        };
    }

    function lift(v){
        return function(f){
            return f(v);
        };
    }

    function bind(f, ctx){
        var args = aslice.call(arguments, 2);
        return function(){
            return f.apply(ctx, args.concat(aslice.call(arguments)));
        };
    }

    function mix(oto, ofrom){
        return Object.keys(ofrom || []).reduce(function(acc, prop){
            acc[prop] = ofrom[prop];
            return acc;
        }, oto);
    }

    function isEntity(key, v){
        return toString.call(v) === '[object Object]' && !!v[key];
    }

    function Build(params){

        function Entity(executor, ctx){
            if(!(this instanceof Entity)){
                return new Entity(executor, ctx);
            }

            this[Latte._KEY_PRIVATE_STATE_PROP] = new Latte._State(bind(executor, ctx), params);
        }

        Entity.prototype.always = function(f, ctx){
            this[Latte._KEY_PRIVATE_STATE_PROP].on(bind(f, ctx), Latte._MODE_ALL);
            return this;
        };

        Entity.prototype.next = function(f, ctx){
            this[Latte._KEY_PRIVATE_STATE_PROP].on(function(v){
                !Latte.isE(v) && f.apply(ctx, arguments);
            }, Latte._MODE_NOT_E);
            return this;
        };

        Entity.prototype.fail = function(f, ctx){
            this[Latte._KEY_PRIVATE_STATE_PROP].on(function(v){
                Latte.isE(v) && f.apply(ctx, arguments);
            }, Latte._MODE_E);
            return this;
        };

        Entity.prototype.when = function(f, ctx){
            return new this.constructor(function(c){
                this.always(function(v){
                    (Latte.isE(v) || f.apply(ctx, arguments)) && c(v);
                });
            }, this);
        };

        Entity.prototype.unless = function(f, ctx){
            return new this.constructor(function(c){
                this.always(function(v){
                    (Latte.isE(v) || !f.apply(ctx, arguments)) && c(v);
                });
            }, this);
        };

        Entity.prototype.lift = function(f, ctx){
            return new this.constructor(function(c){
                this.always(function(v){
                    Latte.isE(v) ? c(v) : c(f.apply(ctx, arguments));
                });
            }, this);
        };

        Entity.prototype.pass = function(v){
            return this.lift(fconst(v));
        };

        Entity.prototype.elift = function(f, ctx){
            return new this.constructor(function(c){
                this.always(function(v){
                    !Latte.isE(v) ? c(v) : c(f.apply(ctx, arguments));
                });
            }, this);
        };

        Entity.prototype.bnd = function(f, ctx){
            return new this.constructor(function(c){
                this.always(function(v){
                    Latte.isE(v) ? c(v) : f.apply(ctx, arguments).always(c);
                });
            }, this);
        };

        Entity.prototype.ebnd = function(f, ctx){
            return new this.constructor(function(c){
                this.always(function(v){
                    !Latte.isE(v) ? c(v) : f.apply(ctx, arguments).always(c);
                });
            }, this);
        };

        Entity.prototype.wait = function(delay){
            var tid = null;

            return new this.constructor(function(c){
                return this.always(function(v){
                    tid && clearTimeout(tid);
                    tid = setTimeout(function(){
                        c(v);
                        tid = null;
                    }, delay);
                });
            }, this);
        };

        Entity.prototype.allseq = function(xs){
            return this.constructor.allseq([this].concat(xs));
        };

        Entity.prototype.seq = function(xs){
            return this.constructor.seq([this].concat(xs));
        };

        Entity.prototype.any = function(xs){
            return this.constructor.any([this].concat(xs));
        };

        Entity.prototype.log = function(){
            console && typeof console.log === 'function' && this.always(bind(console.log, console));
            return this;
        };

        Entity.Shell = function(val){
            var inp = new Entity(arguments.length ? lift(val) : noop),
                out = new Entity(inp.always, inp);

            inp.set = function(v){
                this[Latte._KEY_PRIVATE_STATE_PROP].set(v);
                return this;
            };

            inp.get = function(){
                return this[Latte._KEY_PRIVATE_STATE_PROP].get();
            };

            return {

                set : function(val){
                    inp.set(val);
                    return this;
                },

                get : bind(inp.get, inp),
                out : fconst(out)
            };
        };

        Entity.Gen = function(g, ctx){
            var shell = new Entity.Shell(),
                out = new Entity(function(h){
                    shell.out().always(function(v){
                        var gn = g.call(ctx, v);

                        (function _gen(val){
                            var state = gn.next(val),
                                rval = state.value;

                            state.done ? h(rval) : (Latte.isLatte(rval) ? rval.next(_gen).fail(h) : _gen(rval));
                        }());
                    });
                });

            return {

                set : function(val){
                    shell.set(val);
                    return this;
                },

                get : bind(shell.get, shell),
                out : fconst(out)
            };
        };

        Entity.allseq = (function(isResetAcc){
            return function(xs){
                var len = xs.length;

                return new this(len ? function(h){
                    var acc = [];

                    xs.forEach(function(x, i){
                        x.always(function(v){
                            acc[i] = v;

                            if(Object.keys(acc).length === len){
                                h(acc.some(Latte.isE) ? Latte.E(acc.concat()) : acc.concat());
                                isResetAcc && (acc = []);
                            }
                        });
                    });
                } : lift([]));
            };
        }(params.immutable));

        Entity.seq = function(xs){
            return this.allseq(xs).elift(function(vs){
                return vs.value.filter(Latte.isE)[0];
            });
        };

        Entity.any = function(ss){
            return new this(function(h){
                ss.forEach(function(s){
                    s.always(h);
                });
            });
        };

        Object.defineProperty(Entity.prototype, params.key, {value : true});

        return Entity;
    }

    Latte.version = '5.0.0';

    Latte.Promise = Build({immutable : true, key : KEY_PROMISE});

    Latte.Stream = Build({immutable : false, key : KEY_STREAM});

    Latte.isPromise = function(v){
        return isEntity(KEY_PROMISE, v);
    };

    Latte.isStream = function(v){
        return isEntity(KEY_STREAM, v);
    };

    Latte.E = function(v){
        return Object.defineProperty({value : v}, KEY_E, {value : true});
    };

    Latte.isE = function(v){
        return isEntity(KEY_E, v);
    };

    Latte.isNothing = function(v){
        return v === Latte._NOTHING;
    };

    Latte.isLatte = function(v){
        return Latte.isPromise(v) || Latte.isStream(v);
    };

    Latte.extend = function(Entity, ext){
        var Ctor;

        ext = ext || {};

        Ctor = ext.hasOwnProperty('constructor') ?
            ext.constructor :
            function Ctor(executor, ctx){
                if(!(this instanceof Ctor)){
                    return new Ctor(executor, ctx);
                }

                Entity.call(this, executor, ctx);
            };

        Ctor.prototype = Object.create(Entity.prototype);
        Ctor.prototype.constructor = Ctor;
        mix(Ctor.prototype, ext);

        return mix(Ctor, Entity);
    };

    Latte._KEY_PRIVATE_STATE_PROP = '_____####![state]';
    Latte._NOTHING = new String('NOTHING');

    Latte._MODE_NOT_E = 0;
    Latte._MODE_E = 1;
    Latte._MODE_ALL = 2;

    Latte._State = function(executor, params){
        this._params = params;
        this._queue = [];

        this._prev = {};
        this._prev[Latte._MODE_NOT_E] = Latte._NOTHING;
        this._prev[Latte._MODE_E] = Latte._NOTHING;
        this._prev[Latte._MODE_ALL] = Latte._NOTHING;

        this._val = Latte._NOTHING;
        executor(bind(this.set, this));
    };

    Latte._State.prototype.on = function(f, mode){
        var fobj = {fn : f, mode : mode};
        this._queue && this._queue.push(fobj);
        !Latte.isNothing(this._val) && this._fapply(fobj);
    };

    Latte._State.prototype.set = function(v){
        if(Latte.isNothing(this._val) || !this._params.immutable){
            this._prev[Latte._MODE_ALL] = this._val;
            this._prev[Latte.isE(this._val) ? Latte._MODE_E : Latte._MODE_NOT_E] = this._val;
            this._val = v;
            this._queue && this._queue.forEach(this._fapply, this);
            this._params.immutable && (this._queue = null);
        }
    };

    Latte._State.prototype._fapply = function(fobj){
        fobj.fn(this._val, this._prev[fobj.mode]);
        return this;
    };

    Latte._State.prototype.get = function(){
        return this._val;
    };

    return Latte;
}));