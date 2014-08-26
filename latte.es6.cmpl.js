"use strict";
Object.defineProperties(exports, {
  default: {get: function() {
      return $__default;
    }},
  __esModule: {value: true}
});
var __moduleName = "latte.es6";
var M_KEY = '___M',
    E_KEY = '___E',
    S_KEY = '___S',
    NOTHING = new String('Nothing');
var Latte = {version: '4.1.0'},
    toString = Object.prototype.toString,
    id = (function(v) {
      return v;
    }),
    bindc = (function(f, ctx) {
      return (function(v) {
        return f.call(ctx, v);
      });
    }),
    compose = (function(f, g) {
      return (function(x) {
        return f(g(x));
      });
    }),
    cond = (function(p, t, f) {
      return (function(v) {
        return p(v) ? t(v) : f(v);
      });
    }),
    meth = (function(mname) {
      for (var args = [],
          $__2 = 1; $__2 < arguments.length; $__2++)
        $traceurRuntime.setProperty(args, $__2 - 1, arguments[$traceurRuntime.toProperty($__2)]);
      return (function(o) {
        return o[$traceurRuntime.toProperty(mname)].apply(o, args);
      });
    }),
    isFunction = (function(v) {
      return toString.call(v) === '[object Function]';
    }),
    isObject = (function(v) {
      return toString.call(v) === '[object Object]';
    }),
    isEntity = (function(f, prop) {
      return (function(v) {
        return f(v) && !!v[$traceurRuntime.toProperty(prop)];
      });
    }),
    gen = (function(g, h, v) {
      var $__4 = g.next(v),
          done = $__4.done,
          value = $__4.value;
      !done ? (Latte.isM(value) ? value.next(gen.bind(null, g, h)).fail(h) : gen(g, h, value)) : h(value);
    }),
    staticMetaMethods = {
      allseq: (function(isResetAcc) {
        return function(xs) {
          var len = xs.length;
          return new this(len ? (function(h) {
            var acc = [];
            xs.forEach((function(x, i) {
              return x.always((function(v) {
                $traceurRuntime.setProperty(acc, i, v);
                if (Object.keys(acc).length === len) {
                  h(acc);
                  isResetAcc && (acc = []);
                }
              }));
            }));
          }) : (function(h) {
            return h([]);
          }));
        };
      }),
      seq: (function(smeth) {
        return function(xs) {
          return this[$traceurRuntime.toProperty(smeth)](xs).lift((function(vs) {
            var ret = [];
            {
              try {
                throw undefined;
              } catch ($v) {
                try {
                  throw undefined;
                } catch ($l) {
                  try {
                    throw undefined;
                  } catch ($i) {
                    {
                      {
                        $i = 0;
                        $l = vs.length;
                      }
                      for (; $i < $l; $i += 1) {
                        try {
                          throw undefined;
                        } catch (v) {
                          try {
                            throw undefined;
                          } catch (l) {
                            try {
                              throw undefined;
                            } catch (i) {
                              {
                                {
                                  i = $i;
                                  l = $l;
                                  v = $v;
                                }
                                try {
                                  v = vs[$traceurRuntime.toProperty(i)];
                                  if (xs[$traceurRuntime.toProperty(i)].constructor.isE(v)) {
                                    ret = null;
                                    return v;
                                  }
                                  ret.push(v);
                                } finally {
                                  $i = i;
                                  $l = l;
                                  $v = v;
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            return ret;
          }));
        };
      }),
      spread: (function(smeth, imeth) {
        return function(f, xs, ctx) {
          return this[$traceurRuntime.toProperty(smeth)](xs)[$traceurRuntime.toProperty(imeth)]((function(a) {
            return f.apply(ctx, a);
          }));
        };
      })
    };
var State = function State(executor, params) {
  this._params = params;
  this._queue = [];
  this.val = NOTHING;
  executor(bindc(this._set, this));
};
($traceurRuntime.createClass)(State, {
  on: function(f) {
    this._queue && this._queue.push(f);
    this.val !== NOTHING && f(this.val);
  },
  _set: function(v) {
    if (this.val === NOTHING || !this._params.immutable) {
      this._queue.forEach((function(f) {
        return f(v);
      }));
      this._params.immutable && (this._queue = null);
      this.val = v;
    }
  }
}, {});
function Build(params) {
  function L(executor, ctx) {
    if (!(this instanceof L)) {
      return new (Function.prototype.bind.apply(L, $traceurRuntime.spread([null], Array.from(arguments))))();
    }
    $traceurRuntime.setProperty(this, Latte._STATE_PRIVATE_PROP, new Latte._State(bindc(executor, ctx), params));
  }
  L.E = Latte.E;
  L.isE = Latte.isE;
  L.prototype.always = function(f, ctx) {
    this[$traceurRuntime.toProperty(Latte._STATE_PRIVATE_PROP)].on(bindc(f, ctx));
    return this;
  };
  L.prototype.next = function(f, ctx) {
    return this.always(cond(this.constructor.isE, id, bindc(f, ctx)));
  };
  L.prototype.fail = function(f, ctx) {
    return this.always(cond(this.constructor.isE, bindc(f, ctx), id));
  };
  L.prototype.bnd = function(f, ctx) {
    var $__0 = this;
    return new this.constructor((function(c) {
      return $__0.always(cond($__0.constructor.isE, c, compose(meth('always', c), bindc(f, ctx))));
    }));
  };
  L.prototype.lift = function(f, ctx) {
    var $__0 = this;
    return new this.constructor((function(c) {
      return $__0.always(cond($__0.constructor.isE, c, compose(c, bindc(f, ctx))));
    }));
  };
  L.prototype.raise = function(f, ctx) {
    var $__0 = this;
    return new this.constructor((function(c) {
      return $__0.always(cond($__0.constructor.isE, compose(c, compose($__0.constructor.E, bindc(f, ctx))), c));
    }));
  };
  L.prototype.repair = function(f, ctx) {
    var $__0 = this;
    return new this.constructor((function(c) {
      return $__0.always(cond($__0.constructor.isE, compose(meth('always', c), bindc(f, ctx)), c));
    }));
  };
  L.prototype.when = function(f, ctx) {
    var $__0 = this;
    return new this.constructor((function(c) {
      return $__0.next(cond(bindc(f, ctx), c, id));
    }));
  };
  L.prototype.unless = function(f, ctx) {
    var $__0 = this;
    return new this.constructor((function(c) {
      return $__0.next(cond(bindc(f, ctx), id, c));
    }));
  };
  L.prototype.pass = function(v) {
    return this.lift((function() {
      return v;
    }));
  };
  L.prototype.wait = function(delay) {
    var $__0 = this;
    var tid = null;
    return new this.constructor((function(c) {
      return $__0.always((function(v) {
        tid && clearTimeout(tid);
        tid = setTimeout((function() {
          c(v);
          tid = null;
        }), delay);
      }));
    }));
  };
  L.Hand = function() {
    var val = NOTHING,
        f;
    return {
      hand: function(v) {
        if (val === NOTHING || !params.immutable) {
          val = v;
          f && f(v);
        }
      },
      inst: new this((function(h) {
        f = h;
        val !== NOTHING && f(val);
      }))
    };
  };
  L.Gen = function(g, ctx) {
    return new this((function(h) {
      return gen(bindc(g, ctx)(h), h);
    }));
  };
  L.allseq = staticMetaMethods.allseq(true);
  L.seq = staticMetaMethods.seq('allseq');
  L.lift = staticMetaMethods.spread('seq', 'lift');
  L.bnd = staticMetaMethods.spread('seq', 'bnd');
  if (params.key === S_KEY) {
    L.pallseq = staticMetaMethods.allseq(false);
    L.pseq = staticMetaMethods.seq('pallseq');
    L.plift = staticMetaMethods.spread('pseq', 'lift');
    L.pbnd = staticMetaMethods.spread('pseq', 'bnd');
    L.any = function(ss) {
      return new this((function(h) {
        return ss.forEach(meth('always', h));
      }));
    };
  }
  if (params.key === M_KEY) {
    L.Pack = function(v) {
      return new this((function(f) {
        return f(v);
      }));
    };
  }
  Object.defineProperty(L.prototype, params.key, {value: true});
  return L;
}
Latte._State = State;
Latte._STATE_PRIVATE_PROP = Symbol('_state');
Latte.E = (function(v) {
  return Object.defineProperty((function() {
    return v;
  }), E_KEY, {value: true});
});
Latte.isE = isEntity(isFunction, E_KEY);
Latte.isM = isEntity(isObject, M_KEY);
Latte.isS = isEntity(isObject, S_KEY);
Latte.isL = (function(v) {
  return Latte.isM(v) || Latte.isS(v);
});
Latte.M = Build({
  immutable: true,
  key: M_KEY
});
Latte.S = Build({
  immutable: false,
  key: S_KEY
});
Latte.compose = (function($__4, initVal) {
  var $__5 = $__4,
      fn = $__5[0],
      fns = Array.prototype.slice.call($__5, 1);
  return fns.reduce((function(acc, f) {
    return acc.bnd(f);
  }), fn(initVal));
});
Latte.extend = (function(L) {
  var ext = arguments[1] !== (void 0) ? arguments[1] : {};
  var Ctor = ext.hasOwnProperty('constructor') ? ext.constructor : function Ctor() {
    for (var args = [],
        $__3 = 0; $__3 < arguments.length; $__3++)
      $traceurRuntime.setProperty(args, $__3, arguments[$traceurRuntime.toProperty($__3)]);
    if (!(this instanceof Ctor)) {
      return new (Function.prototype.bind.apply(Ctor, $traceurRuntime.spread([null], args)))();
    }
    L.apply(this, args);
  };
  Object.assign(Object.setPrototypeOf(Ctor.prototype, L.prototype), ext);
  return Object.assign(Ctor, L);
});
var $__default = Latte;