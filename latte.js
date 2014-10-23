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

        PROP_E = '_____####![E]',
        PROP_PROMISE = '_____####![PROMISE]',
        PROP_STREAM = '_____####![STREAM]',
        PROP_CALLBACK = '_____####![CALLBACK]',

        aslice = Array.prototype.slice,
        toString = Object.prototype.toString;

    function noop(){}

    function fconst(v){
        return function(){
            return v;
        };
    }

    function not(v){
        return !v;
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

    function compose(f, g){
        return function(){
            return f(g.apply(null, arguments));
        };
    }

    function mix(oto, ofrom){
        return Object.keys(ofrom || []).reduce(function(acc, prop){
            acc[prop] = ofrom[prop];
            return acc;
        }, oto);
    }

    function cond(f, g, h){
        return function(){
            return f.apply(null, arguments) ? g.apply(null, arguments) : h.apply(null, arguments);
        };
    }

    function prop(p){
        return function(o){
            return o[p];
        };
    }

    function isEntity(key, v){
        return toString.call(v) === '[object Object]' && !!v[key];
    }

    function unpackEntity(f, v){
        Latte.isLatte(v) ? v.always(function(val){
            f(val);
        }) : f(v);
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
            this[Latte._KEY_PRIVATE_STATE_PROP].on(cond(Latte.isE, noop, bind(f, ctx)), Latte._MODE_NOT_E);
            return this;
        };

        Entity.prototype.fail = function(f, ctx){
            this[Latte._KEY_PRIVATE_STATE_PROP].on(cond(Latte.isE, bind(f, ctx), noop), Latte._MODE_E);
            return this;
        };

        Entity.prototype.when = function(f, ctx){
            return new this.constructor(function(c){
                this.next(cond(bind(f, ctx), c, noop)).fail(c);
            }, this);
        };

        Entity.prototype.unless = function(f, ctx){
            return this.when(compose(not, bind(f, ctx)));
        };

        Entity.prototype.fmap = function(f, ctx){
            return new this.constructor(function(c){
                this.next(compose(bind(unpackEntity, null, c), bind(f, ctx))).fail(c);
            }, this);
        };

        Entity.prototype.efmap = function(f, ctx){
            return new this.constructor(function(c){
                this.next(c).fail(compose(bind(unpackEntity, null, c), bind(f, ctx)));
            }, this);
        };

        Entity.prototype.pass = function(v){
            return this.fmap(fconst(v));
        };

        Entity.prototype.wait = function(delay){
            return new this.constructor(function(c){
                var tid = null;

                return this.always(function(v){
                    tid && clearTimeout(tid);
                    tid = setTimeout(function(){
                        c(v);
                        tid = null;
                    }, delay);
                });
            }, this);
        };

        Entity.prototype.gacc = function(g, ctx){
            return new this.constructor(function(c){
                var gen = null;

                this.next(function(v){
                    var r = (gen = gen || g.apply(ctx, arguments)).next(v);
                    unpackEntity(cond(Latte.isE, c, function(val){
                        if(r.done){
                            c(val);
                            gen = null;
                        }
                    }), r.value);
                }).fail(c);
            }, this);
        };

        Entity.prototype.log = function(){
            console && typeof console.log === 'function' && this.always(bind(console.log, console));
            return this;
        };

        Entity.prototype.combine = function(xs){
            return this.constructor.collect([this].concat(xs));
        };

        Entity.prototype.any = function(xs){
            return this.constructor.any([this].concat(xs));
        };

        Entity.init = function(v){
            return new this(lift(v));
        };

        Entity.collectAll = (function(isResetAcc){
            return function(xs){
                var len = xs.length;

                return new this(len ? function(h){
                    var acc = [];

                    xs.forEach(function(x, i){
                        unpackEntity(function(v){
                            acc[i] = v;

                            if(Object.keys(acc).length === len){
                                h(acc.some(Latte.isE) ? Latte.E(acc.concat()) : acc.concat());
                                isResetAcc && (acc = []);
                            }
                        }, x);
                    });
                } : lift([]));
            };
        }(params.immutable));

        Entity.collect = function(xs){
            return this.collectAll(xs).efmap(function(x){
                return x.value.filter(Latte.isE)[0];
            });
        };

        Entity.any = function(xs){
            return new this(function(h){
                xs.forEach(bind(unpackEntity, null, h));
            });
        };

        Entity.fun = function(f, ctx){
            return bind(function(){
                return this.collect(aslice.call(arguments)).fmap(function(v){
                    var cbs = v.filter(Latte.isCallback),
                        r = f.apply(ctx, v);

                    return cbs.length ? this.any(cbs.map(prop(PROP_CALLBACK))) : r;
                }, this);
            }, this);
        };

        Entity.gen = function(g, ctx){
            return bind(function(){
                return this.collect(aslice.call(arguments)).fmap(function(v){
                    return new this(function(h){
                        var gen = g.apply(ctx, v);

                        (function _iterate(val){
                            var state = gen.next(val);
                            unpackEntity(state.done ? h : cond(Latte.isE, h, _iterate), state.value);
                        }());
                    });
                }, this);
            }, this);
        };

        Entity.shell = function(){
            var s = new this(noop);

            s.set = function(v){
                this[Latte._KEY_PRIVATE_STATE_PROP].set(v);
                return this;
            };

            s.get = function(){
                return this[Latte._KEY_PRIVATE_STATE_PROP].get();
            };

            return {

                set : function(val){
                    s.set(val);
                    return this;
                },

                get : bind(s.get, s),
                out : fconst(new this(s.always, s))
            };
        };

        Object.defineProperty(Entity.prototype, params.key, {value : true});

        return Entity;
    }

    Latte.version = '5.2.2';

    Latte.Promise = Build({immutable : true, key : PROP_PROMISE});
    Latte.Stream = Build({immutable : false, key : PROP_STREAM});

    Latte.isPromise = bind(isEntity, null, PROP_PROMISE);
    Latte.isStream = bind(isEntity, null, PROP_STREAM);
    Latte.isE = bind(isEntity, null, PROP_E);

    Latte.E = function(v){
        return Object.defineProperty({value : v}, PROP_E, {value : true});
    };

    Latte.isNothing = function(v){
        return v === Latte._NOTHING;
    };

    Latte.isCallback = function(v){
        return toString.call(v) === '[object Function]' && !!v[PROP_CALLBACK];
    };

    Latte.isLatte = function(v){
        return Latte.isPromise(v) || Latte.isStream(v);
    };

    Latte.callback = function(f, ctx){
        var shell = Latte.Stream.shell();

        return Object.defineProperty(function(){
            var r = f.apply(ctx || this, arguments);
            shell.set(r);
            return r;
        }, PROP_CALLBACK, {value : shell.out()});
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
        return this;
    };

    Latte._State.prototype.set = function(v){
        unpackEntity(bind(this._set, this), v);
        return this;
    };

    Latte._State.prototype.get = function(){
        return this._val;
    };

    Latte._State.prototype._set = function(v){
        if(Latte.isNothing(this._val) || !this._params.immutable){
            this._prev[Latte._MODE_ALL] = this._val;
            this._prev[Latte.isE(this._val) ? Latte._MODE_E : Latte._MODE_NOT_E] = this._val;
            this._val = v;
            this._queue && this._queue.forEach(this._fapply, this);
            this._params.immutable && (this._queue = null);
        }

        return this;
    };

    Latte._State.prototype._fapply = function(fobj){
        fobj.fn(this._val, this._prev[fobj.mode]);
        return this;
    };

    return Latte;
}));