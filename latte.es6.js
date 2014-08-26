/**
 * Autor: Evstigneev Andrey
 * Date: 25.08.2014
 * Time: 21:25
 */

const M_KEY = '___M',
      E_KEY = '___E',
      S_KEY = '___S',
      NOTHING = new String('Nothing');

var Latte = {version : '4.1.0'},

    toString = Object.prototype.toString,

    id = v => v,

    bindc = (f, ctx) => v => f.call(ctx, v),

    compose = (f, g) => x => f(g(x)),

    cond = (p, t, f) => v => p(v) ? t(v) : f(v),

    meth = (mname, ...args) => o => o[mname].apply(o, args),

    isFunction = v => toString.call(v) === '[object Function]',

    isObject = v => toString.call(v) === '[object Object]',

    isEntity = (f, prop) => v => f(v) && !!v[prop],

    gen = (g, h, v) => {
        var {done, value} = g.next(v);
        !done ? (Latte.isM(value) ? value.next(gen.bind(null, g, h)).fail(h) : gen(g, h, value)) : h(value);
    },

    staticMetaMethods = {

        allseq : isResetAcc => function(xs){
            var len = xs.length;

            return new this(len ? h => {
                var acc = [];

                xs.forEach((x, i) => x.always(v => {
                    acc[i] = v;

                    if(Object.keys(acc).length === len){
                        h(acc);
                        isResetAcc && (acc = []);
                    }
                }));

            } : h => h([]));
        },

        seq : smeth => function(xs){
            return this[smeth](xs).lift(vs => {
                var ret = [];

                for(let i = 0, l = vs.length, v; i < l; i += 1){
                    v = vs[i];

                    if(xs[i].constructor.isE(v)){
                        ret = null;
                        return v;
                    }

                    ret.push(v);
                }

                return ret;
            });
        },

        spread : (smeth, imeth) => function(f, xs, ctx){
            return this[smeth](xs)[imeth](a => f.apply(ctx, a));
        }
    };

class State {

    constructor(executor, params){
        this._params = params;
        this._queue = [];
        this.val = NOTHING;
        executor(bindc(this._set, this));
    }

    on(f) {
        this._queue && this._queue.push(f);
        this.val !== NOTHING && f(this.val);
    }

    _set(v) {
        if(this.val === NOTHING || !this._params.immutable){
            this._queue.forEach(f => f(v));
            this._params.immutable && (this._queue = null);
            this.val = v;
        }
    }
}

function Build(params){

    function L(executor, ctx){
        if(!(this instanceof L)){
            return new L(...Array.from(arguments));
        }

        this[Latte._STATE_PRIVATE_PROP] = new Latte._State(bindc(executor, ctx), params);
    }

    L.E = Latte.E;
    L.isE = Latte.isE;

    L.prototype.always = function(f, ctx){
        this[Latte._STATE_PRIVATE_PROP].on(bindc(f, ctx));
        return this;
    };

    L.prototype.next = function(f, ctx){
        return this.always(cond(this.constructor.isE, id, bindc(f, ctx)));
    };

    L.prototype.fail = function(f, ctx){
        return this.always(cond(this.constructor.isE, bindc(f, ctx), id));
    };

    L.prototype.bnd = function(f, ctx){
        return new this.constructor(
            c => this.always(cond(this.constructor.isE, c, compose(meth('always', c), bindc(f, ctx))))
        );
    };

    L.prototype.lift = function(f, ctx){
        return new this.constructor(c => this.always(cond(this.constructor.isE, c, compose(c, bindc(f, ctx)))));
    };

    L.prototype.raise = function(f, ctx){
        return new this.constructor(
            c => this.always(cond(this.constructor.isE, compose(c, compose(this.constructor.E, bindc(f, ctx))), c))
        );
    };

    L.prototype.repair = function(f, ctx){
        return new this.constructor(
            c => this.always(cond(this.constructor.isE, compose(meth('always', c), bindc(f, ctx)), c))
        );
    };

    L.prototype.when = function(f, ctx){
        return new this.constructor(c => this.next(cond(bindc(f, ctx), c, id)));
    };

    L.prototype.unless = function(f, ctx){
        return new this.constructor(c => this.next(cond(bindc(f, ctx), id, c)));
    };

    L.prototype.pass = function(v){
        return this.lift(() => v);
    };

    L.prototype.wait = function(delay){
        var tid = null;

        return new this.constructor(c => this.always(v => {
            tid && clearTimeout(tid);
            tid = setTimeout(() => {
                c(v);
                tid = null;
            }, delay);
        }));
    };

    L.Hand = function(){
        var val = NOTHING,
            f;

        return {

            hand(v) {
                if(val === NOTHING || !params.immutable){
                    val = v;
                    f && f(v);
                }
            },

            inst : new this(h => {
                f = h;
                val !== NOTHING && f(val);
            })
        };
    };

    L.Gen = function(g, ctx){
        return new this(h => gen(bindc(g, ctx)(h), h));
    };

    L.allseq = staticMetaMethods.allseq(true);
    L.seq = staticMetaMethods.seq('allseq');
    L.lift = staticMetaMethods.spread('seq', 'lift');
    L.bnd = staticMetaMethods.spread('seq', 'bnd');

    if(params.key === S_KEY){
        L.pallseq = staticMetaMethods.allseq(false);
        L.pseq = staticMetaMethods.seq('pallseq');
        L.plift = staticMetaMethods.spread('pseq', 'lift');
        L.pbnd = staticMetaMethods.spread('pseq', 'bnd');
        L.any = function(ss){
            return new this(h => ss.forEach(meth('always', h)));
        };
    }

    if(params.key === M_KEY){
        L.Pack = function(v){
            return new this(f => f(v));
        };
    }

    Object.defineProperty(L.prototype, params.key, {value : true});

    return L;
}

Latte._State = State;

Latte._STATE_PRIVATE_PROP = Symbol('_state');

Latte.E = v => Object.defineProperty(() => v, E_KEY, {value : true});
Latte.isE = isEntity(isFunction, E_KEY);
Latte.isM = isEntity(isObject, M_KEY);
Latte.isS = isEntity(isObject, S_KEY);
Latte.isL = v => Latte.isM(v) || Latte.isS(v);

Latte.M = Build({immutable : true, key : M_KEY});
Latte.S = Build({immutable : false, key : S_KEY});

Latte.compose = ([fn, ...fns], initVal) => fns.reduce((acc, f) => acc.bnd(f), fn(initVal));

Latte.extend = (L, ext = {}) => {
    var Ctor = ext.hasOwnProperty('constructor') ?
        ext.constructor :
        function Ctor(...args){
            if(!(this instanceof Ctor)){
                return new Ctor(...args);
            }

            L.apply(this, args);
        };

    Object.assign(Object.setPrototypeOf(Ctor.prototype, L.prototype), ext);

    return Object.assign(Ctor, L);
};

export default Latte;