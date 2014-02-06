/**
 * Autor: Evstigneev Andrey
 * Date: 05.02.14
 * Time: 22:52
 */

var assert = require("assert"),
    Latte = require("../latte.js"),

    stub = function(ret){
        var fn = function(){

            fn.called = true;
            fn.count += 1;
            fn.args = arguments;

            return typeof ret === 'function' ? ret({
                args : arguments,
                context : this,
                self : fn
            }) : ret;
        };

        fn.called = false;
        fn.count = 0;
        fn.args = null;

        fn.reset = function(){
            fn.called = false;
            fn.count = 0;
            fn.args = null;
        };

        return fn;
    };

describe('Monadic Laws', function(){

    it('(return x) >>= f == f x --Left Identity', function(){
        var x = 'test',
            f = function(v){
                return Latte(v + '!!!');
            },
            st1 = stub(),
            st2 = stub();

        Latte(x).bnd(f).always(st1);
        f(x).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });

    it('f <=< return == f --Alternative Identity', function(){
        var x = 'test',
            f = function(v){
                return Latte(v + '!!!');
            },
            st1 = stub(),
            st2 = stub();

        Latte.arw(f, Latte)(x).always(st1);
        f(x).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });

    it('return <=< f == f --Alternative Identity 2', function(){
        var x = 'test',
            f = function(v){
                return Latte(v + '!!!');
            },
            st1 = stub(),
            st2 = stub();

        Latte.arw(Latte, f)(x).always(st1);
        f(x).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });

    it('m >>= return == m --Right identity', function(){
        var x = 'test',
            st1 = stub(),
            st2 = stub();

        Latte(x).bnd(Latte).always(st1);
        Latte(x).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });

    it('m >>= return == m --Right Identity', function(){
        var x = 'test',
            st1 = stub(),
            st2 = stub();

        Latte(x).bnd(Latte).always(st1);
        Latte(x).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });

    it('(m >>= f) >>= g == m >>= (λx -> f x >>= g) --Associativity', function(){
        var x = Latte('test'),
            st1 = stub(),
            st2 = stub(),
            f = function(x){
                return Latte('[' + x + ']');
            },
            g = function(x){
                return Latte('<' + x + '>');
            };

        Latte(x).bnd(f).bnd(g).always(st1);
        Latte(x).bnd(function(x){
            return f(x).bnd(g);
        }).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });

    it('(f <=< g) <=< h == f <=< (g <=< h) --Alternative Associativity', function(){
        var x = Latte('test'),
            st1 = stub(),
            st2 = stub(),
            f = function(x){
                return Latte('[' + x + ']');
            },
            g = function(x){
                return Latte('<' + x + '>');
            },
            h = function(x){
                return Latte('{' + x + '}');
            };

        Latte.arw(function(x){
            return Latte.arw(f, g)(x);
        }, h)(x).always(st1);

        Latte.arw(f, function(x){
            return Latte.arw(g, h)(x);
        })(x).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });
});

describe('Latte', function(){

    it('проверка Latte', function(){
        assert.equal(Latte.isLatte(), false);
        assert.equal(Latte.isLatte(''), false);
        assert.equal(Latte.isLatte(0), false);
        assert.equal(Latte.isLatte(NaN), false);
        assert.equal(Latte.isLatte(null), false);
        assert.equal(Latte.isLatte({}), false);
        assert.equal(Latte.isLatte(function(){}), false);

        assert.equal(Latte.isLatte(Latte(1)), true);
        assert.equal(Latte.isLatte(Latte(Latte.E('e'))), true);
    });

    it('проверка E', function(){
        assert.equal(Latte.isE(), false);
        assert.equal(Latte.isE(''), false);
        assert.equal(Latte.isE(0), false);
        assert.equal(Latte.isE(NaN), false);
        assert.equal(Latte.isE(Error), false);
        assert.equal(Latte.isE({}), false);
        assert.equal(Latte.isE(function(){}), false);
        assert.equal(Latte.isE(null), false);
        assert.equal(Latte.isE(undefined), false);

        assert.equal(Latte.isE(Latte.E()), true);
        assert.equal(Latte.isE(Latte.E('error')), true);
    });

    it('Later вызов с задержкой', function(done){
       var st = stub();

       Latte.Later(function(h){
           setTimeout(function(){
               h('test');
           }, 10);
       }).always(st);

       setTimeout(function(){
           assert.equal(st.called, true);
           assert.equal(st.count, 1);
           assert.equal(st.args.length, 1);
           assert.equal(st.args[0], 'test');
           done();
       }, 20);
    });

    it('Later вызов с задержкой и E', function(done){
        var st = stub();

        Latte.Later(function(h){
            setTimeout(function(){
                h(Latte.E('error'));
            }, 10);
        }).always(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.count, 1);
            assert.equal(st.args.length, 1);
            assert.equal(st.args[0](), 'error');
            done();
        }, 20);
    });

    it('Later немедленный вызов', function(){
        var st = stub();

        Latte.Later(function(h){
            h('test');
        }).always(st);

        assert.equal(st.called, true);
        assert.equal(st.args[0], 'test');
    });

    it('Later немедленный вызов c E', function(){
        var st = stub();

        Latte.Later(function(h){
            h(Latte.E('error'));
        }).always(st);

        assert.equal(st.called, true);
        assert.equal(st.args[0](), 'error');
    });

    it('Later игнорирование возвращаемого значения', function(done){
        var st = stub();

        Latte.Later(function(h){
            setTimeout(function(){
                h('test');
            }, 10);

            return Latte('new test');
        }).always(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.args[0], 'test');
            done();
        }, 20);
    });

    it('Later игнорирование повторных вызовов обработчика', function(){
        var st = stub();

        Latte.Later(function(h){
            h('test');
            h('test-1');
            h(Latte.E('error'));
        }).always(st);

        assert.equal(st.called, true);
        assert.equal(st.args[0], 'test');
    });

    it('Later вызов функции только один раз', function(){
        var st = stub(),
            f = function(){},

            l = Latte.Later(function(h){
                h('test');
                st();
            });

        l.always(f);
        l.always(f);
        l.always(f);

        assert.equal(st.called, true);
        assert.equal(st.count, 1);
    });

    it('Later немедленный вызов функции', function(){
        var st = stub();

        Latte.Later(st);

        assert.equal(st.called, true);
    });

    it('Later игнорирование контекста вызова', function(){
        var st = stub();

        Latte.Later.call(null, function(h){
            h('test');
        }).always(st);

        assert.equal(st.called, true);
        assert.equal(st.args[0], 'test');
    });

    it('создание значения', function(){
        var st = stub();

        Latte('test').always(st);

        assert.equal(st.called, true);
        assert.equal(st.args[0], 'test');
    });

    it('создание E значения', function(){
        var st = stub();

        Latte(Latte.E('error')).always(st);

        assert.equal(st.called, true);
        assert.equal(Latte.isE(st.args[0]), true);
    });

    it('always метод', function(){
        var st1 = stub(),
            st2 = stub();

        Latte().always(st1);
        Latte(Latte.E()).always(st2);

        assert.equal(st1.called, true);
        assert.equal(st2.called, true);
    });

    it('always метод не переопределяет значение', function(){
        var st1 = stub(),
            st2 = stub();

        Latte('test').always(function(v){
            return Latte('new ' + v);
        }).always(st1);

        Latte(Latte.E('error')).always(function(v){
            return v() + '!';
        }).always(st2);

        assert.equal(st1.args[0], 'test');
        assert.equal(st2.args[0](), 'error');
    });

    it('always от одного объекта', function(done){
        var m = Latte.Later(function(h){
                setTimeout(function(){
                    h('test');
                }, 10);
            }),
            st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            st4 = stub();

        m.always(st1).always(st2);
        m.always(st3).always(st4);

        setTimeout(function(){
            assert.equal(st1.args[0], 'test');
            assert.equal(st2.args[0], 'test');
            assert.equal(st3.args[0], 'test');
            assert.equal(st4.args[0], 'test');

            done();
        }, 20);
    });

    it('next метод', function(){
        var st1 = stub(),
            st2 = stub();

        Latte().next(st1);
        Latte(Latte.E()).next(st2);

        assert.equal(st1.called, true);
        assert.equal(st2.called, false);
    });

    it('next метод не переопределяет значение', function(){
        var st1 = stub(),
            st2 = stub();

        Latte('test').next(function(v){
            return Latte('new ' + v);
        }).next(st1);

        Latte('test').next(function(v){
            return v + '!';
        }).next(st2);

        assert.equal(st1.args[0], 'test');
        assert.equal(st2.args[0], 'test');
    });

    it('next от одного объекта', function(done){
        var m = Latte.Later(function(h){
                setTimeout(function(){
                    h('test');
                }, 10);
            }),
            st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            st4 = stub();

        m.next(st1).next(st2);
        m.next(st3).next(st4);

        setTimeout(function(){
            assert.equal(st1.args[0], 'test');
            assert.equal(st2.args[0], 'test');
            assert.equal(st3.args[0], 'test');
            assert.equal(st4.args[0], 'test');

            done();
        }, 20);
    });

    it('fail метод', function(){
        var st1 = stub(),
            st2 = stub();

        Latte().fail(st1);
        Latte(Latte.E()).fail(st2);

        assert.equal(st1.called, false);
        assert.equal(st2.called, true);
    });

    it('fail метод не переопределяет значение', function(){
        var st1 = stub(),
            st2 = stub();

        Latte(Latte.E('error')).fail(function(v){
            return Latte(Latte.E('new ' + v()));
        }).fail(st1);

        Latte(Latte.E('error')).fail(function(v){
            return v() + '!';
        }).fail(st2);

        assert.equal(st1.args[0](), 'error');
        assert.equal(st2.args[0](), 'error');
    });

    it('fail продолжения с bnd', function(){
        var fret = stub(),
            st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            st4 = stub();

        Latte('test').bnd(function(v){
            return Latte(v).bnd(function(v){
                return Latte(Latte.E('error')).bnd(fret).fail(st3);
            }).bnd(fret).fail(st4);
        }).bnd(fret).bnd(fret).fail(st1).bnd(fret).bnd(fret).fail(st2);

        assert.equal(fret.called, false);

        assert.equal(st1.called, true);
        assert.equal(st1.args[0](), 'error');
        assert.equal(st2.called, true);
        assert.equal(st2.args[0](), 'error');
        assert.equal(st3.called, true);
        assert.equal(st3.args[0](), 'error');
        assert.equal(st4.called, true);
        assert.equal(st4.args[0](), 'error');
    });

    it('fail продолжения с lift', function(){
        var fid = stub(),
            st1 = stub(),
            st2 = stub();

        Latte('test').lift(function(v){
            return Latte.E('error');
        }).lift(fid).lift(fid).fail(st1).lift(fid).lift(fid).fail(st2);

        assert.equal(fid.called, false);

        assert.equal(st1.called, true);
        assert.equal(st1.args[0](), 'error');
        assert.equal(st2.called, true);
        assert.equal(st2.args[0](), 'error');
    });

    it('fail от одного объекта', function(done){
        var m = Latte.Later(function(h){
                setTimeout(function(){
                    h(Latte.E('error'));
                }, 10);
            }),
            st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            st4 = stub();

        m.fail(st1).fail(st2);
        m.fail(st3).fail(st4);

        setTimeout(function(){
            assert.equal(st1.args[0](), 'error');
            assert.equal(st2.args[0](), 'error');
            assert.equal(st3.args[0](), 'error');
            assert.equal(st4.args[0](), 'error');

            done();
        }, 20);
    });

    it('bnd метод', function(){
        var st = stub();

        Latte('test').bnd(function(v){
            return Latte(v + '!!!');
        }).next(st);

        assert.equal(st.args[0], 'test!!!');
    });

    it('bnd метод возвращает E', function(){
        var st = stub();

        Latte('test').bnd(function(v){
            return Latte(Latte.E('error ' + v));
        }).fail(st);

        assert.equal(st.args[0](), 'error test');
    });

    it('bnd не вызывается при E', function(){
        var st = stub();

        Latte('test').bnd(function(v){
            return Latte(Latte.E('error'));
        }).bnd(st);

        assert.equal(st.called, false);
    });

    it('bnd вложенные вызовы', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            st4 = stub();

        Latte('test').bnd(function(v){
            return Latte(v + '!');
        }).bnd(function(v){
            return Latte(v).bnd(function(newV){
                return Latte('[' + newV + ']').bnd(function(newV2){
                    return Latte('<' + newV2 + '>').next(st4);
                }).next(st3);
            }).next(st2);
        }).next(st1);

        assert.equal(st1.args[0], '<[test!]>');
        assert.equal(st2.args[0], '<[test!]>');
        assert.equal(st3.args[0], '<[test!]>');
        assert.equal(st4.args[0], '<[test!]>');
    });

    it('lift метод', function(){
        var st = stub();

        Latte('test').lift(function(v){
            return v + '!!';
        }).lift(function(v){
            return v + '!';
        }).next(st);

        assert.equal(st.args[0], 'test!!!');
    });

    it('lift метод возвращает E', function(){
        var st = stub();

        Latte('test').lift(function(v){
            return Latte.E('error ' + v);
        }).fail(st);

        assert.equal(st.args[0](), 'error test');
    });

    it('lift метод не вызывается при E', function(){
        var st = stub();

        Latte('test').lift(function(v){
            return Latte.E('error ' + v);
        }).lift(st);

        assert.equal(st.called, false);
    });

    it('lift метод c дополнительным аргументом', function(){
        var st1 = stub(),
            st2 = stub(),
            m = Latte(1);

        m.lift(function(a, b){
            return a + b;
        }, m).always(st1);

        m.always(st2);

        assert.equal(st1.args[0], 2);
        assert.equal(st2.args[0], 1);
    });

    it('lift c дополнительным массивом значений', function(){
        var st1 = stub(),
            st2 = stub(),
            m = Latte(1);

        m.lift(function(a, b, c, d){
            return a + b + c + d;
        }, [m,m,m]).always(st1);

        m.always(st2);

        assert.equal(st1.args[0], 4);
        assert.equal(st2.args[0], 1);
    });

    it('lift c пустым массивом значений', function(){
        var st1 = stub(),
            st2 = stub(),
            m = Latte(1);

        m.lift(function(a, b, c, d){
            return a;
        }, []).always(st1);

        m.always(st2);

        assert.equal(st1.args[0], 1);
        assert.equal(st2.args[0], 1);
    });

    it('lift первое значение - E', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),

            m1 = Latte(Latte.E('error')),
            m2 = Latte(2);

        m1.lift(function(a, b){
            return a + b;
        }, m2).always(st1);

        m1.always(st2);
        m2.always(st3);

        assert.equal(st1.args[0](), 'error');
        assert.equal(st2.args[0](), 'error');
        assert.equal(st3.args[0], 2);
    });

    it('lift второе значение - E', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),

            m1 = Latte(1),
            m2 = Latte(Latte.E('error'));

        m1.lift(function(a, b){
            return a + b;
        }, m2).always(st1);

        m1.always(st2);
        m2.always(st3);

        assert.equal(st1.args[0](), 'error');
        assert.equal(st2.args[0], 1);
        assert.equal(st3.args[0](), 'error');
    });

    it('lift оба значения - E', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),

            m1 = Latte(Latte.E('error-1')),
            m2 = Latte(Latte.E('error-2'));

        m1.lift(function(a, b){
            return a + b;
        }, m2).always(st1);

        m1.always(st2);
        m2.always(st3);

        assert.equal(st1.args[0](), 'error-1');
        assert.equal(st2.args[0](), 'error-1');
        assert.equal(st3.args[0](), 'error-2');
    });

    it('and оба значения не E', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            m1 = Latte(1),
            m2 = Latte(2);

        m1.and(m2).always(st1);

        m1.always(st2);
        m2.always(st3);

        assert.equal(st1.args[0], 2);
        assert.equal(st2.args[0], 1);
        assert.equal(st3.args[0], 2);
    });

    it('and первое значение - E', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            m1 = Latte(Latte.E('error')),
            m2 = Latte(2);

        m1.and(m2).always(st1);

        m1.always(st2);
        m2.always(st3);

        assert.equal(st1.args[0](), 'error');
        assert.equal(st2.args[0](), 'error');
        assert.equal(st3.args[0], 2);
    });

    it('and второе значение - E', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            m1 = Latte(1),
            m2 = Latte(Latte.E('error'));

        m1.and(m2).always(st1);

        m1.always(st2);
        m2.always(st3);

        assert.equal(st1.args[0](), 'error');
        assert.equal(st2.args[0], 1);
        assert.equal(st3.args[0](), 'error');
    });

    it('and оба значения - E', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            m1 = Latte(Latte.E('error-1')),
            m2 = Latte(Latte.E('error-2'));

        m1.and(m2).always(st1);

        m1.always(st2);
        m2.always(st3);

        assert.equal(st1.args[0](), 'error-1');
        assert.equal(st2.args[0](), 'error-1');
        assert.equal(st3.args[0](), 'error-2');
    });

    it('or оба значения не E', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            m1 = Latte(1),
            m2 = Latte(2);

        m1.or(m2).always(st1);

        m1.always(st2);
        m2.always(st3);

        assert.equal(st1.args[0], 1);
        assert.equal(st2.args[0], 1);
        assert.equal(st3.args[0], 2);
    });

    it('or первое значение - E', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            m1 = Latte(Latte.E('error')),
            m2 = Latte(2);

        m1.or(m2).always(st1);

        m1.always(st2);
        m2.always(st3);

        assert.equal(st1.args[0], 2);
        assert.equal(st2.args[0](), 'error');
        assert.equal(st3.args[0], 2);
    });

    it('or второе значение - E', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            m1 = Latte(1),
            m2 = Latte(Latte.E('error'));

        m1.or(m2).always(st1);

        m1.always(st2);
        m2.always(st3);

        assert.equal(st1.args[0], 1);
        assert.equal(st2.args[0], 1);
        assert.equal(st3.args[0](), 'error');
    });

    it('or оба значения - E', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            m1 = Latte(Latte.E('error-1')),
            m2 = Latte(Latte.E('error-2'));

        m1.or(m2).always(st1);

        m1.always(st2);
        m2.always(st3);

        assert.equal(st1.args[0](), 'error-2');
        assert.equal(st2.args[0](), 'error-1');
        assert.equal(st3.args[0](), 'error-2');
    });

    it('collect', function(){
        var st = stub();
        Latte.collect([Latte(1), Latte(2), Latte(3)]).always(st);
        assert.deepEqual(st.args[0], [1,2,3]);
    });

    it('collect пустой массив', function(){
        var st = stub();
        Latte.collect([]).always(st);
        assert.deepEqual(st.args[0], []);
    });

    it('collect co значением E в массиве', function(){
        var st = stub();
        Latte.collect([Latte(1), Latte(Latte.E('e')), Latte(3)]).always(st);
        assert.equal(st.args[0](), 'e');
    });

    it('collect последовательность результатов', function(done){
        var st = stub(),
            m1 = Latte.Later(function(h){
                setTimeout(function(){
                    h(1);
                }, 20);
            }),
            m2 = Latte(2),
            m3 = Latte.Later(function(h){
                setTimeout(function(){
                    h(3);
                }, 10);
            });

        Latte.collect([m1, m2, m3]).always(st);

        setTimeout(function(){
            assert.deepEqual(st.args[0], [1,2,3]);
            done();
        }, 100);
    });

    it('fold', function(){
        var st = stub();

        Latte.fold([Latte(1), Latte(2), Latte(3)], 0, function(acc, v){
            return acc += v;
        }).always(st);

        assert.equal(st.args[0], 6);
    });

    it('fold пустой массив', function(){
        var st = stub();

        Latte.fold([], 0, function(acc, v){
            return acc += v;
        }).always(st);

        assert.equal(st.args[0], 0);
    });

    it('fold co значением E в массиве', function(){
        var st = stub();

        Latte.fold([Latte(1), Latte(Latte.E('e')), Latte(3)], 0, function(acc, v){
            return acc += v;
        }).always(st);

        assert.equal(st.args[0](), 'e');
    });

    it('all', function(){
        var st = stub();
        Latte.all([Latte(1), Latte(2), Latte(3)]).always(st);
        assert.deepEqual(st.args[0], [1,2,3]);
    });

    it('all пустой массив', function(){
        var st = stub();
        Latte.all([]).always(st);
        assert.deepEqual(st.args[0], []);
    });

    it('all co значением E в массиве', function(){
        var st = stub();

        Latte.all([Latte(1), Latte(Latte.E('e')), Latte(3)]).always(st);

        assert.equal(st.args[0].length, 3);

        assert.equal(st.args[0][0], 1);
        assert.equal(st.args[0][1](), 'e');
        assert.equal(st.args[0][2], 3);
    });

    it('static lift', function(){
        var st = stub();

        Latte.lift(function(a){
            return a + '!!!';
        })(Latte('test')).always(st);

        assert.equal(st.args[0], 'test!!!');
    });

    it('static lift массив с одним элементом', function(){
        var st = stub();

        Latte.lift(function(a){
            return a + '!!!';
        })([Latte('test')]).always(st);

        assert.equal(st.args[0], 'test!!!');
    });

    it('static lift массив с несколькими элементами', function(){
        var st = stub();

        Latte.lift(function(a, b, c){
            return a + b + c;
        })([Latte('test'), Latte(' '), Latte('Latte')]).always(st);

        assert.equal(st.args[0], 'test Latte');
    });

    it('static lift массив с несколькими элементами и значением E', function(){
        var st = stub();

        Latte.lift(function(a, b, c){
            return a + b + c;
        })([Latte('test'), Latte(' '), Latte(Latte.E('e'))]).always(st);

        assert.equal(st.args[0](), 'e');
    });

    it('arw без E значений', function(){
        var st = stub();

        Latte.arw(function(v){
            return Latte(v + '?');
        }, function(v){
            return Latte(v + '!');
        })('test').always(st);

        assert.equal(st.args[0], 'test?!');
    });

    it('arw c E значением', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.arw(function(v){
            return Latte(Latte.E('error'));
        }, st1, st1, st1)('test').always(st2);

        assert.equal(st1.called, false);
        assert.equal(st2.args[0](), 'error');
    });

});