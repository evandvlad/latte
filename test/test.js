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
                return Latte.Mv(v + '!!!');
            },
            st1 = stub(),
            st2 = stub();

        Latte.Mv(x).bnd(f).always(st1);
        f(x).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });

    it('m >>= return == m --Right identity', function(){
        var x = 'test',
            st1 = stub(),
            st2 = stub();

        Latte.Mv(x).bnd(Latte.Mv).always(st1);
        Latte.Mv(x).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });

    it('m >>= return == m --Right Identity', function(){
        var x = 'test',
            st1 = stub(),
            st2 = stub();

        Latte.Mv(x).bnd(Latte.Mv).always(st1);
        Latte.Mv(x).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });

    it('(m >>= f) >>= g == m >>= (λx -> f x >>= g) --Associativity', function(){
        var x = Latte.Mv('test'),
            st1 = stub(),
            st2 = stub(),
            f = function(x){
                return Latte.Mv('[' + x + ']');
            },
            g = function(x){
                return Latte.Mv('<' + x + '>');
            };

        Latte.Mv(x).bnd(f).bnd(g).always(st1);
        Latte.Mv(x).bnd(function(x){
            return f(x).bnd(g);
        }).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });
});

describe('Latte Monad', function(){

    it('M с задержкой', function(done){
        var st = stub();

        Latte.M(function(h){
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

    it('M с задержкой и значением E', function(done){
        var st = stub();

        Latte.M(function(h){
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

    it('M немедленный вызов', function(){
        var st = stub();

        Latte.M(function(h){
            h('test');
        }).always(st);

        assert.equal(st.called, true);
        assert.equal(st.args[0], 'test');
    });

    it('M немедленный вызов cо значением E', function(){
        var st = stub();

        Latte.M(function(h){
            h(Latte.E('error'));
        }).always(st);

        assert.equal(st.called, true);
        assert.equal(st.args[0](), 'error');
    });

    it('M игнорирование возвращаемого значения', function(done){
        var st = stub();

        Latte.M(function(h){
            setTimeout(function(){
                h('test');
            }, 10);

            return Latte.Mv('new test');
        }).always(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.args[0], 'test');
            done();
        }, 20);
    });

    it('M игнорирование повторных вызовов обработчика', function(){
        var st = stub();

        Latte.M(function(h){
            h('test');
            h('test-1');
            h(Latte.E('error'));
        }).always(st);

        assert.equal(st.called, true);
        assert.equal(st.args[0], 'test');
    });

    it('M вызов функции только один раз', function(){
        var st = stub(),
            f = function(){},

            l = Latte.M(function(h){
                h('test');
                st();
            });

        l.always(f);
        l.always(f);
        l.always(f);

        assert.equal(st.called, true);
        assert.equal(st.count, 1);
    });

    it('M немедленный вызов функции', function(){
        var st = stub();

        Latte.M(st);

        assert.equal(st.called, true);
    });

    it('M игнорирование контекста вызова', function(){
        var st = stub();

        Latte.M.call(null, function(h){
            h('test');
        }).always(st);

        assert.equal(st.called, true);
        assert.equal(st.args[0], 'test');
    });

    it('Mv создание значения', function(){
        var st = stub();

        Latte.Mv('test').always(st);

        assert.equal(st.called, true);
        assert.equal(st.args[0], 'test');
    });

    it('Mv создание E значения', function(){
        var st = stub();

        Latte.Mv(Latte.E('error')).always(st);

        assert.equal(st.called, true);
        assert.equal(Latte.isE(st.args[0]), true);
    });

    it('always', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.Mv().always(st1);
        Latte.Mv(Latte.E()).always(st2);

        assert.equal(st1.called, true);
        assert.equal(st2.called, true);
    });

    it('always метод не переопределяет значение', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.Mv('test').always(function(v){
            return Latte.Mv('new ' + v);
        }).always(st1);

        Latte.Mv(Latte.E('error')).always(function(v){
            return v() + '!';
        }).always(st2);

        assert.equal(st1.args[0], 'test');
        assert.equal(st2.args[0](), 'error');
    });

    it('always от одного объекта', function(done){
        var m = Latte.M(function(h){
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

    it('next', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.Mv().next(st1);
        Latte.Mv(Latte.E()).next(st2);

        assert.equal(st1.called, true);
        assert.equal(st2.called, false);
    });

    it('next метод не переопределяет значение', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.Mv('test').next(function(v){
            return Latte.Mv('new ' + v);
        }).next(st1);

        Latte.Mv('test').next(function(v){
            return v + '!';
        }).next(st2);

        assert.equal(st1.args[0], 'test');
        assert.equal(st2.args[0], 'test');
    });

    it('next от одного объекта', function(done){
        var m = Latte.M(function(h){
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

    it('fail', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.Mv().fail(st1);
        Latte.Mv(Latte.E()).fail(st2);

        assert.equal(st1.called, false);
        assert.equal(st2.called, true);
    });

    it('fail метод не переопределяет значение', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.Mv(Latte.E('error')).fail(function(v){
            return Latte.Mv(Latte.E('new ' + v()));
        }).fail(st1);

        Latte.Mv(Latte.E('error')).fail(function(v){
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

        Latte.Mv('test').bnd(function(v){
            return Latte.Mv(v).bnd(function(v){
                return Latte.Mv(Latte.E('error')).bnd(fret).fail(st3);
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

        Latte.Mv('test').lift(function(v){
            return Latte.E('error');
        }).lift(fid).lift(fid).fail(st1).lift(fid).lift(fid).fail(st2);

        assert.equal(fid.called, false);

        assert.equal(st1.called, true);
        assert.equal(st1.args[0](), 'error');
        assert.equal(st2.called, true);
        assert.equal(st2.args[0](), 'error');
    });

    it('fail от одного объекта', function(done){
        var m = Latte.M(function(h){
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

    it('bnd', function(){
        var st = stub();

        Latte.Mv('test').bnd(function(v){
            return Latte.Mv(v + '!!!');
        }).next(st);

        assert.equal(st.args[0], 'test!!!');
    });

    it('bnd метод возвращает E', function(){
        var st = stub();

        Latte.Mv('test').bnd(function(v){
            return Latte.Mv(Latte.E('error ' + v));
        }).fail(st);

        assert.equal(st.args[0](), 'error test');
    });

    it('bnd не вызывается при E', function(){
        var st = stub();

        Latte.Mv('test').bnd(function(v){
            return Latte.Mv(Latte.E('error'));
        }).bnd(st);

        assert.equal(st.called, false);
    });

    it('bnd вложенные вызовы', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            st4 = stub();

        Latte.Mv('test').bnd(function(v){
            return Latte.Mv(v + '!');
        }).bnd(function(v){
                return Latte.Mv(v).bnd(function(newV){
                    return Latte.Mv('[' + newV + ']').bnd(function(newV2){
                        return Latte.Mv('<' + newV2 + '>').next(st4);
                    }).next(st3);
                }).next(st2);
            }).next(st1);

        assert.equal(st1.args[0], '<[test!]>');
        assert.equal(st2.args[0], '<[test!]>');
        assert.equal(st3.args[0], '<[test!]>');
        assert.equal(st4.args[0], '<[test!]>');
    });

    it('lift', function(){
        var st = stub();

        Latte.Mv('test').lift(function(v){
            return v + '!!';
        }).lift(function(v){
            return v + '!';
        }).next(st);

        assert.equal(st.args[0], 'test!!!');
    });

    it('lift метод возвращает E', function(){
        var st = stub();

        Latte.Mv('test').lift(function(v){
            return Latte.E('error ' + v);
        }).fail(st);

        assert.equal(st.args[0](), 'error test');
    });

    it('lift метод не вызывается при E', function(){
        var st = stub();

        Latte.Mv('test').lift(function(v){
            return Latte.E('error ' + v);
        }).lift(st);

        assert.equal(st.called, false);
    });

    it('raise', function(){
        var st = stub(),
            st2 = stub();

        Latte.Mv(Latte.E('e')).raise(function(e){
            return 'new ' + e();
        }).fail(st).always(st2);

        assert.equal(st.args[0](), 'new e');
        assert.equal(st2.args[0](), 'new e');
    });

    it('raise не вызывается при отсутствии E значения', function(){
        var st = stub(),
            st2 = stub();

        Latte.Mv('test').raise(st).always(st2);

        assert.equal(st.called, false);
        assert.equal(st2.args[0], 'test');
    });

    it('seq', function(){
        var st = stub();
        Latte.Mv(1).seq([Latte.Mv(2), Latte.Mv(3)]).always(st);
        assert.deepEqual(st.args[0], [1,2,3]);
    });

    it('seq c пустым массивом', function(){
        var st = stub();
        Latte.Mv(1).seq([]).always(st);
        assert.deepEqual(st.args[0], [1]);
    });

    it('seq co значением E в массиве', function(){
        var st = stub();
        Latte.Mv(1).seq([Latte.Mv(Latte.E('e')), Latte.Mv(3)]).always(st);
        assert.equal(st.args[0](), 'e');
    });

    it('seq от значения E', function(){
        var st = stub();
        Latte.Mv(Latte.E('e')).seq([Latte.Mv(1), Latte.Mv(2)]).always(st);
        assert.equal(st.args[0](), 'e');
    });

    it('seq последовательность результатов', function(done){
        var st = stub(),
            m1 = Latte.M(function(h){
                setTimeout(function(){
                    h(1);
                }, 20);
            }),
            m2 = Latte.Mv(2),
            m3 = Latte.M(function(h){
                setTimeout(function(){
                    h(3);
                }, 10);
            });

        m1.seq([m2, m3]).always(st);

        setTimeout(function(){
            assert.deepEqual(st.args[0], [1,2,3]);
            done();
        }, 100);
    });

    it('fold', function(){
        var st = stub();

        Latte.M.fold(function(acc, v){
            return acc += v;
        }, 0, [Latte.Mv(1), Latte.Mv(2), Latte.Mv(3)]).always(st);

        assert.equal(st.args[0], 6);
    });

    it('fold пустой массив', function(){
        var st = stub();

        Latte.M.fold(function(acc, v){
            return acc += v;
        }, 0, []).always(st);

        assert.equal(st.args[0], 0);
    });

    it('fold co значением E в массиве', function(){
        var st = stub();

        Latte.M.fold(function(acc, v){
            return acc += v;
        }, 0, [Latte.Mv(1), Latte.Mv(Latte.E('e')), Latte.Mv(3)]).always(st);

        assert.equal(st.args[0](), 'e');
    });

    it('static seq пустой массив', function(){
        var st = stub();
        Latte.M.seq([]).always(st);
        assert.deepEqual(st.args[0], []);
    });

    it('allseq', function(){
        var st = stub();
        Latte.M.allseq([Latte.Mv(1), Latte.Mv(2), Latte.Mv(3)]).always(st);
        assert.deepEqual(st.args[0], [1,2,3]);
    });

    it('allseq пустой массив', function(){
        var st = stub();
        Latte.M.allseq([]).always(st);
        assert.deepEqual(st.args[0], []);
    });

    it('allseq co значением E в массиве', function(){
        var st = stub();

        Latte.M.allseq([Latte.Mv(1), Latte.Mv(Latte.E('e')), Latte.Mv(3)]).always(st);

        assert.equal(st.args[0].length, 3);

        assert.equal(st.args[0][0], 1);
        assert.equal(st.args[0][1](), 'e');
        assert.equal(st.args[0][2], 3);
    });

    it('static lift', function(){
        var st = stub();

        Latte.M.lift(function(a){
            return a + '!!!';
        }, [Latte.Mv('test')]).always(st);

        assert.equal(st.args[0], 'test!!!');
    });

    it('static lift массив с несколькими элементами', function(){
        var st = stub();

        Latte.M.lift(function(a, b, c){
            return a + b + c;
        }, [Latte.Mv('test'), Latte.Mv(' '), Latte.Mv('Latte')]).always(st);

        assert.equal(st.args[0], 'test Latte');
    });

    it('static lift массив с несколькими элементами и значением E', function(){
        var st = stub();

        Latte.M.lift(function(a, b, c){
            return a + b + c;
        }, [Latte.Mv('test'), Latte.Mv(' '), Latte.Mv(Latte.E('e'))]).always(st);

        assert.equal(st.args[0](), 'e');
    });
});

describe('Latte Arrow', function(){

    it('always', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.A(function(v){
            return Latte.Mv(v + '!!!');
        }).always(st1)('test').always(st2);

        assert.equal(st1.args[0], 'test!!!');
        assert.equal(st2.args[0], 'test!!!');
    });

    it('always и значение E', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.A(function(v){
            return Latte.Mv(Latte.E('e'));
        }).always(st1)('test').always(st2);

        assert.equal(st1.args[0](), 'e');
        assert.equal(st2.args[0](), 'e');
    });

    it('always не переопределяет значение', function(){
        var st = stub();

        Latte.A(function(v){
            return Latte.Mv(v + '!!!');
        }).always(function(v){
            return Latte.Mv('rest');
        })('test').always(st);

        assert.equal(st.args[0], 'test!!!');
    });

    it('next', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.A(function(v){
            return Latte.Mv(v + '!!!');
        }).next(st1)('test').always(st2);

        assert.equal(st1.args[0], 'test!!!');
        assert.equal(st2.args[0], 'test!!!');
    });

    it('next и значение E', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.A(function(v){
            return Latte.Mv(Latte.E('e'));
        }).next(st1)('test').always(st2);

        assert.equal(st1.called, false);
        assert.equal(st2.args[0](), 'e');
    });

    it('next не переопределяет значение', function(){
        var st = stub();

        Latte.A(function(v){
            return Latte.Mv(v + '!!!');
        }).next(function(v){
            return Latte.Mv('rest');
        })('test').always(st);

        assert.equal(st.args[0], 'test!!!');
    });

    it('fail', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.A(function(v){
            return Latte.Mv(v + '!!!');
        }).fail(st1)('test').always(st2);

        assert.equal(st1.called, false);
        assert.equal(st2.args[0], 'test!!!');
    });

    it('fail и значение E', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.A(function(v){
            return Latte.Mv(Latte.E('e'));
        }).fail(st1)('test').always(st2);

        assert.equal(st1.args[0](), 'e');
        assert.equal(st2.args[0](), 'e');
    });

    it('fail не переопределяет значение', function(){
        var st = stub();

        Latte.A(function(v){
            return Latte.Mv(Latte.E('e'));
        }).fail(function(v){
            return Latte.Mv(Latte.E('new e'));
        })('test').always(st);

        assert.equal(st.args[0](), 'e');
    });

    it('bnd', function(){
        var st = stub();

        Latte.A(Latte.Mv).bnd(function(x){
            return Latte.Mv(x + 'b');
        }).bnd(function(x){
            return Latte.Mv(x + 'c');
        })('a').always(st);

        assert.equal(st.args[0], 'abc');
    });

    it('bnd со значением E', function(){
        var st = stub();

        Latte.A(Latte.Mv).bnd(function(x){
            return Latte.Mv(Latte.E('e'));
        }).bnd(function(x){
            return Latte.Mv(x + 'c');
        })('a').always(st);

        assert.equal(st.args[0](), 'e');
    });

    it('lift', function(){
        var st = stub();

        Latte.A(Latte.Mv).lift(function(x){
            return x + 'b';
        }).lift(function(x){
            return x + 'c';
        })('a').always(st);

        assert.equal(st.args[0], 'abc');
    });

    it('lift со значением E', function(){
        var st = stub();

        Latte.A(Latte.Mv).lift(function(x){
            return Latte.E('e');
        }).lift(function(x){
            return x + 'c';
        })('a').always(st);

        assert.equal(st.args[0](), 'e');
    });

    it('lift и bnd', function(){
        var st = stub();

        Latte.A(Latte.Mv).lift(function(x){
            return x + 'b';
        }).bnd(function(x){
            return Latte.Mv(x + 'c');
        }).lift(function(x){
            return x + 'd';
        })('a').always(st);

        assert.equal(st.args[0], 'abcd');
    });

    it('lift и bnd cо значением E', function(){
        var st = stub();

        Latte.A(Latte.Mv).lift(function(x){
            return x + 'b';
        }).bnd(function(x){
            return Latte.Mv(Latte.E('e'));
        }).lift(function(x){
            return x + 'd';
        })('a').always(st);

        assert.equal(st.args[0](), 'e');
    });

    it('raise', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.A(function(v){
            return Latte.Mv(v + '!!!');
        }).raise(st1)('test').always(st2);

        assert.equal(st1.called, false);
        assert.equal(st2.args[0], 'test!!!');
    });

    it('raise и значение E', function(){
        var st = stub();

        Latte.A(function(v){
            return Latte.Mv(Latte.E('e'));
        }).raise(function(e){
            return 'new ' + e();
        })('test').always(st);

        assert.equal(st.args[0](), 'new e');
    });

    it('radd', function(){
        var st = stub();

        Latte.A(function(v){
            return Latte.Mv(v + '!');
        }).radd(Latte.A(function(v){
            return Latte.Mv(v + '?');
        }))('test').always(st);

        assert.equal(st.args[0], 'test!?');
    });

    it('radd c E значением', function(){
        var st = stub();

        Latte.A(function(v){
            return Latte.Mv(Latte.E('e'));
        }).radd(Latte.A(function(v){
            return Latte.Mv(v + '?');
        }))('test').always(st);

        assert.equal(st.args[0](), 'e');
    });

    it('radd несколько вызовов по цепочке', function(){
        var st = stub(),
            st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            a1 = Latte.A(function(v){
                return Latte.Mv(v + 'b');
            }),
            a2 = Latte.A(function(v){
                return Latte.Mv(v + 'c');
            }),
            a3 = Latte.A(function(v){
                return Latte.Mv(v + 'd');
            });

        Latte.A(Latte.Mv).radd(a1).radd(a2).radd(a3)('a').always(st);

        a1('a').always(st1);
        a2('a').always(st2);
        a3('a').always(st3);

        assert.equal(st.args[0], 'abcd');

        assert.equal(st1.args[0], 'ab');
        assert.equal(st2.args[0], 'ac');
        assert.equal(st3.args[0], 'ad');
    });

    it('ladd', function(){
        var st1 = stub(),
            st2 = stub(),
            a = Latte.A(function(v){
                return Latte.Mv(v + '?');
            });

        Latte.A(function(v){
            return Latte.Mv(v + '!');
        }).ladd(a)('test').always(st1);

        a('test').always(st2);

        assert.equal(st1.args[0], 'test?!');
        assert.equal(st2.args[0], 'test?');
    });

    it('ladd c E значением', function(){
        var st = stub();

        Latte.A(function(v){
            return Latte.Mv(Latte.E('e'));
        }).ladd(Latte.A(function(v){
            return Latte.Mv(v + '?');
        }))('test').always(st);

        assert.equal(st.args[0](), 'e');
    });

    it('ladd несколько вызовов в цепочке', function(){
        var st = stub(),
            st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            a1 = Latte.A(function(v){
                return Latte.Mv(v + 'd');
            }),
            a2 = Latte.A(function(v){
                return Latte.Mv(v + 'c');
            }),
            a3 = Latte.A(function(v){
                return Latte.Mv(v + 'b');
            });

        Latte.A(Latte.Mv).ladd(a1).ladd(a2).ladd(a3)('a').always(st);

        a1('a').always(st1);
        a2('a').always(st2);
        a3('a').always(st3);

        assert.equal(st.args[0], 'abcd');

        assert.equal(st1.args[0], 'ad');
        assert.equal(st2.args[0], 'ac');
        assert.equal(st3.args[0], 'ab');
    });

    it('seq', function(){
        var st = stub(),
            a1 = Latte.A(function(v){
                return Latte.Mv(v + 1);
            }),
            a2 = Latte.A(function(v){
                return Latte.Mv(v + 2);
            }),
            a3 = Latte.A(function(v){
                return Latte.Mv(v + 3);
            });

        a1.seq([a2, a3])(0).always(st);

        assert.deepEqual(st.args[0], [1,2,3]);
    });

    it('seq со значением E', function(){
        var st = stub(),
            a1 = Latte.A(function(v){
                return Latte.Mv(v + 1);
            }),
            a2 = Latte.A(function(v){
                return Latte.Mv(Latte.E('e'));
            }),
            a3 = Latte.A(function(v){
                return Latte.Mv(v + 3);
            });

        a1.seq([a2, a3])(0).always(st);

        assert.equal(st.args[0](), 'e');
    });

    it('static seq', function(){
        var st = stub(),
            a1 = Latte.A(function(v){
                return Latte.Mv(v + 1);
            }),
            a2 = Latte.A(function(v){
                return Latte.Mv(v + 2);
            }),
            a3 = Latte.A(function(v){
                return Latte.Mv(v + 3);
            });

        Latte.A.seq([a1, a2, a3])(0).always(st);

        assert.deepEqual(st.args[0], [1,2,3]);
    });

    it('static seq от пустого массива', function(){
        var st = stub();

        Latte.A.seq([])(0).always(st);

        assert.deepEqual(st.args[0], []);
    });

    it('static seq со значением E', function(){
        var st = stub(),
            a1 = Latte.A(function(v){
                return Latte.Mv(v + 1);
            }),
            a2 = Latte.A(function(v){
                return Latte.Mv(Latte.E('e'));
            }),
            a3 = Latte.A(function(v){
                return Latte.Mv(v + 3);
            });

        Latte.A.seq([a1, a2, a3])(0).always(st);

        assert.equal(st.args[0](), 'e');
    });

    it('allseq', function(){
        var st = stub(),
            a1 = Latte.A(function(v){
                return Latte.Mv(v + 1);
            }),
            a2 = Latte.A(function(v){
                return Latte.Mv(v + 2);
            }),
            a3 = Latte.A(function(v){
                return Latte.Mv(v + 3);
            });

        Latte.A.allseq([a1, a2, a3])(0).always(st);
        assert.deepEqual(st.args[0], [1,2,3]);
    });

    it('allseq пустой массив', function(){
        var st = stub();
        Latte.A.allseq([])(0).always(st);
        assert.deepEqual(st.args[0], []);
    });

    it('allseq co значением E в массиве', function(){
        var st = stub(),
            a1 = Latte.A(function(v){
                return Latte.Mv(v + 1);
            }),
            a2 = Latte.A(function(v){
                return Latte.Mv(Latte.E('e'));
            }),
            a3 = Latte.A(function(v){
                return Latte.Mv(v + 3);
            });

        Latte.A.allseq([a1, a2, a3])(0).always(st);

        assert.equal(st.args[0].length, 3);

        assert.equal(st.args[0][0], 1);
        assert.equal(st.args[0][1](), 'e');
        assert.equal(st.args[0][2], 3);
    });

    it('fold', function(){
        var st = stub(),
            a1 = Latte.A(function(v){
                return Latte.Mv(v + 1);
            }),
            a2 = Latte.A(function(v){
                return Latte.Mv(v + 2);
            }),
            a3 = Latte.A(function(v){
                return Latte.Mv(v + 3);
            });

        Latte.A.fold(function(acc, v){
            return acc += v;
        }, 0, [a1, a2, a3])(0).always(st);

        assert.equal(st.args[0], 6);
    });

    it('fold пустой массив', function(){
        var st = stub();

        Latte.A.fold(function(acc, v){
            return acc += v;
        }, 0, [])(1).always(st);

        assert.equal(st.args[0], 0);
    });

    it('fold co значением E в массиве', function(){
        var st = stub(),
            a1 = Latte.A(function(v){
                return Latte.Mv(v + 1);
            }),
            a2 = Latte.A(function(v){
                return Latte.Mv(Latte.E('e'));
            }),
            a3 = Latte.A(function(v){
                return Latte.Mv(v + 3);
            });

        Latte.A.fold(function(acc, v){
            return acc += v;
        }, 0, [a1, a2, a3])(0).always(st);

        assert.equal(st.args[0](), 'e');
    });

    it('static lift', function(){
        var st = stub(),
            a = Latte.A(function(v){
                return Latte.Mv(v + 'st');
            });

        Latte.A.lift(function(a){
            return a + '!!!';
        }, [a])('te').always(st);

        assert.equal(st.args[0], 'test!!!');
    });

    it('static lift массив с несколькими элементами', function(){
        var st = stub(),
            a1 = Latte.A(function(v){
                return Latte.Mv(v + 'test');
            }),
            a2 = Latte.A(function(v){
                return Latte.Mv(v + ' ');
            }),
            a3 = Latte.A(function(v){
                return Latte.Mv(v + 'Latte');
            });

        Latte.A.lift(function(a, b, c){
            return a + b + c;
        }, [a1, a2, a3])('').always(st);

        assert.equal(st.args[0], 'test Latte');
    });

    it('static lift массив с несколькими элементами и значением E', function(){
        var st = stub(),
            a1 = Latte.A(function(v){
                return Latte.Mv(v + 'test');
            }),
            a2 = Latte.A(function(v){
                return Latte.Mv(Latte.E('e'));
            }),
            a3 = Latte.A(function(v){
                return Latte.Mv(v + 'Latte');
            });

        Latte.A.lift(function(a, b, c){
            return a + b + c;
        }, [a1, a2, a3])('').always(st);

        assert.equal(st.args[0](), 'e');
    });
});

describe('Latte Stream', function(){

    it('always', function(){
        var st = stub(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).always(st);

        handle(2);
        assert.equal(st.args[0], 2);

        handle(24);
        assert.equal(st.args[0], 24);

        handle(Latte.E('e'));
        assert.equal(st.args[0](), 'e');

        assert.equal(st.count, 3);
    });

    it('always от одного объекта', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            handle,
            s = Latte.S(function(h){
                handle = h;
            });

        s.always(st1);
        s.always(st2);
        s.always(st3);

        handle(2);
        assert.equal(st1.args[0], 2);
        assert.equal(st2.args[0], 2);
        assert.equal(st3.args[0], 2);

        handle(24);
        assert.equal(st1.args[0], 24);
        assert.equal(st2.args[0], 24);
        assert.equal(st3.args[0], 24);

        handle(Latte.E('e'));
        assert.equal(st1.args[0](), 'e');
        assert.equal(st2.args[0](), 'e');
        assert.equal(st3.args[0](), 'e');
    });

    it('next', function(){
        var st = stub(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).next(st);

        handle(2);
        assert.equal(st.args[0], 2);

        handle(24);
        assert.equal(st.args[0], 24);

        handle(Latte.E('e'));

        assert.equal(st.count, 2);
    });

    it('next от одного объекта', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            handle,
            s = Latte.S(function(h){
                handle = h;
            });

        s.next(st1);
        s.next(st2);
        s.next(st3);

        handle(2);
        assert.equal(st1.args[0], 2);
        assert.equal(st2.args[0], 2);
        assert.equal(st3.args[0], 2);

        handle(24);
        assert.equal(st1.args[0], 24);
        assert.equal(st2.args[0], 24);
        assert.equal(st3.args[0], 24);

        handle(Latte.E('e'));
        assert.equal(st1.count, 2);
        assert.equal(st2.count, 2);
        assert.equal(st3.count, 2);
    });

    it('fail', function(){
        var st = stub(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).fail(st);

        handle(2);
        assert.equal(st.called, false);

        handle(24);
        assert.equal(st.called, false);

        handle(Latte.E('e'));

        assert.equal(st.args[0](), 'e');
    });

    it('fail от одного объекта', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            handle,
            s = Latte.S(function(h){
                handle = h;
            });

        s.fail(st1);
        s.fail(st2);
        s.fail(st3);

        handle(2);
        assert.equal(st1.called, false);
        assert.equal(st1.called, false);
        assert.equal(st1.called, false);

        handle(24);
        assert.equal(st1.called, false);
        assert.equal(st1.called, false);
        assert.equal(st1.called, false);

        handle(Latte.E('e'));
        assert.equal(st1.args[0](), 'e');
        assert.equal(st2.args[0](), 'e');
        assert.equal(st3.args[0](), 'e');
    });

    it('bnd', function(){
        var st = stub(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).bnd(function(v){
            return Latte.Mv(v + 5);
        }).always(st);

        handle(1);
        assert.equal(st.args[0], 6);

        handle('t');
        assert.equal(st.args[0], 't5');

        handle(Latte.E('e'));
        assert.equal(st.args[0](), 'e');
    });

    it('bnd генерирует значение E', function(){
        var st = stub(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).bnd(function(v){
            return Latte.Mv(Latte.E('e'));
        }).always(st);

        handle(1);
        assert.equal(st.args[0](), 'e');

        handle('t');
        assert.equal(st.args[0](), 'e');

        handle(Latte.E('e'));
        assert.equal(st.args[0](), 'e');
    });

    it('bnd вложенные вызовы', function(){
        var st = stub(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).bnd(function(v){
            return Latte.Mv(v).bnd(function(nv){
                return Latte.Mv('[' + nv + ']');
            });
        }).always(st);

        handle(1);
        assert.equal(st.args[0], '[1]');

        handle('t');
        assert.equal(st.args[0], '[t]');

        handle(Latte.E('e'));
        assert.equal(st.args[0](), 'e');
    });

    it('lift', function(){
        var st = stub(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).lift(function(v){
            return v + 5;
        }).lift(function(v){
            return '(' + v + ')';
        }).always(st);

        handle(1);
        assert.equal(st.args[0], '(6)');

        handle('t');
        assert.equal(st.args[0], '(t5)');

        handle(Latte.E('e'));
        assert.equal(st.args[0](), 'e');
    });

    it('raise', function(){
        var st = stub(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).raise(function(e){
            return 'err: ' + e();
        }).always(st);

        handle(1);
        assert.equal(st.args[0], 1);

        handle('t');
        assert.equal(st.args[0], 't');

        handle(Latte.E('e'));
        assert.equal(st.args[0](), 'err: e');
    });

    it('raise и fail по цепочке', function(){
        var st = stub(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).lift(function(v){
            return v + '!!';
        }).lift(function(v){
            return v + '??';
        }).raise(function(e){
            return 'err: ' + e();
        }).lift(function(v){
            return v + '..';
        }).fail(st);

        handle(1);
        assert.equal(st.called, false);

        handle('t');
        assert.equal(st.called, false);

        handle(Latte.E('e'));
        assert.equal(st.args[0](), 'err: e');
    });

    it('seq', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            });

        Latte.S(function(h){
            handle3 = h;
        }).seq([s1,s2]).always(st);

        handle1(2);
        assert.equal(st.called, false);

        handle2(3);
        assert.equal(st.called, false);

        handle3(1);
        assert.deepEqual(st.args[0], [1,2,3]);
    });

    it('seq пустой список', function(){
        var st = stub(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).seq([]).always(st);

        handle(2);
        assert.deepEqual(st.args[0], [2]);
    });

    it('seq и значение E', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            });

        Latte.S(function(h){
            handle3 = h;
        }).seq([s1,s2]).always(st);

        handle1(2);
        assert.equal(st.called, false);

        handle2(Latte.E('err'));
        assert.equal(st.called, false);

        handle3(1);
        assert.equal(st.args[0](), 'err');
    });

    it('any', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        s1.any([s2, s3]).always(st);

        handle1('test');
        assert.equal(st.args[0], 'test');

        handle2('test 2');
        assert.equal(st.args[0], 'test 2');

        handle1('test 3');
        assert.equal(st.args[0], 'test 3');

        handle3('test 4');
        assert.equal(st.args[0], 'test 4');

        handle2(Latte.E('e'));
        assert.equal(st.args[0](), 'e');
    });

    it('any пустой список', function(){
        var st = stub(),
            handle1,
            s1 = Latte.S(function(h){
                handle1 = h;
            });

        s1.any([]).always(st);

        handle1('test');
        assert.equal(st.args[0], 'test');

        handle1('test 2');
        assert.equal(st.args[0], 'test 2');

        handle1('test 3');
        assert.equal(st.args[0], 'test 3');

        handle1('test 4');
        assert.equal(st.args[0], 'test 4');

        handle1(Latte.E('e'));
        assert.equal(st.args[0](), 'e');
    });

    it('pseq', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            });

        Latte.S(function(h){
            handle3 = h;
        }).pseq([s1,s2]).always(st);

        handle3(1);
        assert.equal(st.called, false);

        handle2(3);
        assert.equal(st.called, false);

        handle1(2);
        assert.deepEqual(st.args[0], [1,2,3]);

        handle1(6);
        assert.deepEqual(st.args[0], [1,6,3]);

        handle2(12);
        assert.deepEqual(st.args[0], [1,6,12]);

        handle3(0);
        assert.deepEqual(st.args[0], [0,6,12]);
    });

    it('pseq пустой список', function(){
        var st = stub(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).pseq([]).always(st);

        handle(2);
        assert.deepEqual(st.args[0], [2]);

        handle(12);
        assert.deepEqual(st.args[0], [12]);
    });

    it('pseq и значение E', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            });

        Latte.S(function(h){
            handle3 = h;
        }).pseq([s1,s2]).always(st);

        handle3(1);
        assert.equal(st.called, false);

        handle2(3);
        assert.equal(st.called, false);

        handle1(2);
        assert.deepEqual(st.args[0], [1,2,3]);

        handle1(6);
        assert.deepEqual(st.args[0], [1,6,3]);

        handle2(12);
        assert.deepEqual(st.args[0], [1,6,12]);

        handle3(0);
        assert.deepEqual(st.args[0], [0,6,12]);

        handle2(Latte.E('err'));
        assert.equal(st.args[0](), 'err');

        handle1(1);
        assert.equal(st.args[0](), 'err');

        handle3(3);
        assert.equal(st.args[0](), 'err');

        handle2(2);
        assert.deepEqual(st.args[0], [3,1,2]);
    });

    it('static seq', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.seq([s1,s2,s3]).always(st);

        handle1(1);
        assert.equal(st.called, false);

        handle2(2);
        assert.equal(st.called, false);

        handle3(3);
        assert.deepEqual(st.args[0], [1,2,3]);
    });

    it('static seq и значение E', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.seq([s1,s2,s3]).always(st);

        handle1(2);
        assert.equal(st.called, false);

        handle2(Latte.E('err'));
        assert.equal(st.called, false);

        handle3(1);
        assert.equal(st.args[0](), 'err');
    });

    it('static allseq', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.allseq([s1,s2,s3]).always(st);

        handle1(1);
        assert.equal(st.called, false);

        handle2(2);
        assert.equal(st.called, false);

        handle3(3);
        assert.deepEqual(st.args[0], [1,2,3]);
    });

    it('static allseq и значение E', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.allseq([s1,s2,s3]).always(st);

        handle1(2);
        assert.equal(st.called, false);

        handle2(Latte.E('err'));
        assert.equal(st.called, false);

        handle3(1);

        assert.equal(st.args[0][0], 2);
        assert.equal(st.args[0][1](), 'err');
        assert.equal(st.args[0][2], 1);
    });

    it('static allseq только если все потоки с новыми данными', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.allseq([s1,s2,s3]).always(st);

        handle1(1);
        assert.equal(st.called, false);

        handle2(2);
        assert.equal(st.called, false);

        handle3(3);
        assert.deepEqual(st.args[0], [1,2,3]);
        st.reset();

        handle1(1);
        handle2(1);
        assert.equal(st.called, false);

        handle2(7);
        handle3(3);

        assert.deepEqual(st.args[0], [1,7,3]);
    });

    it('static fold', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.fold(function(acc, v){
            return acc += v;
        }, 0, [s1,s2,s3]).always(st);

        handle1(1);
        assert.equal(st.called, false);

        handle2(2);
        assert.equal(st.called, false);

        handle3(3);
        assert.equal(st.args[0], 6);

        handle1(2);
        handle2(3);
        handle3(4);
        assert.equal(st.args[0], 9);
    });

    it('static fold и значение E', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.fold(function(acc, v){
            return acc += v;
        }, 0, [s1,s2,s3]).always(st);

        handle1(2);
        assert.equal(st.called, false);

        handle2(Latte.E('err'));
        assert.equal(st.called, false);

        handle3(1);

        assert.equal(st.args[0](), 'err');
    });

    it('static lift', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.lift(function(a,b,c){
            return a + b + c;
        }, [s1,s2,s3]).always(st);

        handle1(1);
        assert.equal(st.called, false);

        handle2(2);
        assert.equal(st.called, false);

        handle3(3);
        assert.deepEqual(st.args[0], 6);
    });

    it('static lift и значение E', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.lift(function(a, b, c){
            return a + b + c;
        }, [s1,s2,s3]).always(st);

        handle1(2);
        assert.equal(st.called, false);

        handle2(Latte.E('err'));
        assert.equal(st.called, false);

        handle3(1);
        assert.equal(st.args[0](), 'err');
    });

    it('static any пустой список', function(){
        assert.throws(function(){
            Latte.S.any([]);
        }, Error);
    });

    it('static any', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.any([s1, s2, s3]).always(st);

        handle1('test');
        assert.equal(st.args[0], 'test');

        handle2('test 2');
        assert.equal(st.args[0], 'test 2');

        handle1('test 3');
        assert.equal(st.args[0], 'test 3');

        handle3('test 4');
        assert.equal(st.args[0], 'test 4');

        handle2(Latte.E('e'));
        assert.equal(st.args[0](), 'e');
    });

    it('static pallseq', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.pallseq([s1,s2,s3]).always(st);

        handle1(11);
        assert.equal(st.called, false);

        handle3(3);
        assert.equal(st.called, false);

        handle1(1);
        assert.equal(st.called, false);

        handle2(2);
        assert.deepEqual(st.args[0], [1,2,3]);
        st.reset();

        handle1(11);
        assert.deepEqual(st.args[0], [11,2,3]);

        handle2(1);
        assert.deepEqual(st.args[0], [11,1,3]);

        handle2(7);
        assert.deepEqual(st.args[0], [11,7,3]);

        handle3(9);
        assert.deepEqual(st.args[0], [11,7,9]);

        handle1(1);
        assert.deepEqual(st.args[0], [1,7,9]);
    });

    it('static pallseq и значение E', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.pallseq([s1,s2,s3]).always(st);

        handle1(1);
        assert.equal(st.called, false);

        handle2(2);
        assert.equal(st.called, false);

        handle3(3);
        assert.deepEqual(st.args[0], [1,2,3]);
        st.reset();

        handle1(11);
        assert.deepEqual(st.args[0], [11,2,3]);

        handle2(1);
        assert.deepEqual(st.args[0], [11,1,3]);

        handle2(7);
        assert.deepEqual(st.args[0], [11,7,3]);

        handle3(9);
        assert.deepEqual(st.args[0], [11,7,9]);

        handle1(Latte.E('e'));
        assert.deepEqual(st.args[0][0](), 'e');
        assert.deepEqual(st.args[0][1], 7);
        assert.deepEqual(st.args[0][2], 9);
    });

    it('static pseq', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.pseq([s1,s2,s3]).always(st);

        handle1(11);
        assert.equal(st.called, false);

        handle2(2);
        assert.equal(st.called, false);

        handle1(1);
        assert.equal(st.called, false);

        handle3(3);
        assert.deepEqual(st.args[0], [1,2,3]);
        st.reset();

        handle1(11);
        assert.deepEqual(st.args[0], [11,2,3]);

        handle2(1);
        assert.deepEqual(st.args[0], [11,1,3]);

        handle2(7);
        assert.deepEqual(st.args[0], [11,7,3]);

        handle3(9);
        assert.deepEqual(st.args[0], [11,7,9]);

        handle1(1);
        assert.deepEqual(st.args[0], [1,7,9]);
    });

    it('static pseq и значение E', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.pseq([s1,s2,s3]).always(st);

        handle1(1);
        assert.equal(st.called, false);

        handle2(2);
        assert.equal(st.called, false);

        handle3(3);
        assert.deepEqual(st.args[0], [1,2,3]);
        st.reset();

        handle1(11);
        assert.deepEqual(st.args[0], [11,2,3]);

        handle2(1);
        assert.deepEqual(st.args[0], [11,1,3]);

        handle2(7);
        assert.deepEqual(st.args[0], [11,7,3]);

        handle3(9);
        assert.deepEqual(st.args[0], [11,7,9]);

        handle1(Latte.E('e'));
        assert.deepEqual(st.args[0](), 'e');
    });

    it('static pfold', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.pfold(function(acc, v){
            return acc += v;
        }, 0, [s1,s2,s3]).always(st);

        handle1(1);
        assert.equal(st.called, false);

        handle2(2);
        assert.equal(st.called, false);

        handle3(3);
        assert.equal(st.args[0], 6);

        handle1(2);
        assert.equal(st.args[0], 7);

        handle2(3);
        assert.equal(st.args[0], 8);

        handle3(4);
        assert.equal(st.args[0], 9);
    });

    it('static pfold и значение E', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.pfold(function(acc, v){
            return acc += v;
        }, 0, [s1,s2,s3]).always(st);

        handle1(1);
        assert.equal(st.called, false);

        handle2(2);
        assert.equal(st.called, false);

        handle3(3);
        assert.equal(st.args[0], 6);

        handle1(2);
        assert.equal(st.args[0], 7);

        handle2(3);
        assert.equal(st.args[0], 8);

        handle3(4);
        assert.equal(st.args[0], 9);

        handle2(Latte.E('err'));
        assert.equal(st.args[0](), 'err');

        handle3(1);
        assert.equal(st.args[0](), 'err');
    });

    it('static plift', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.plift(function(a,b,c){
            return a + b + c;
        }, [s1,s2,s3]).always(st);

        handle1(1);
        assert.equal(st.called, false);

        handle2(2);
        assert.equal(st.called, false);

        handle3(3);
        assert.equal(st.args[0], 6);

        handle2('+');
        assert.equal(st.args[0], '1+3');

        handle1('v');
        assert.equal(st.args[0], 'v+3');

        handle3('w');
        assert.equal(st.args[0], 'v+w');
    });

    it('static plift и значение E', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
            });

        Latte.S.plift(function(a, b, c){
            return a + b + c;
        }, [s1,s2,s3]).always(st);

        handle1(1);
        assert.equal(st.called, false);

        handle2(2);
        assert.equal(st.called, false);

        handle3(3);
        assert.equal(st.args[0], 6);

        handle2('+');
        assert.equal(st.args[0], '1+3');

        handle1('v');
        assert.equal(st.args[0], 'v+3');

        handle3('w');
        assert.equal(st.args[0], 'v+w');

        handle2(Latte.E('err'));
        assert.equal(st.args[0](), 'err');

        handle3(1);
        assert.equal(st.args[0](), 'err');
    });

});

describe('Latte PubSub', function(){

    it('pub/sub', function(){
        var ps = Latte.PS(),
            st1 = stub(),
            st2 = stub();

        ps.sub('a', st1);
        ps.sub('a', st2);

        assert.equal(st1.called, false);
        assert.equal(st2.called, false);

        ps.pub('a', 1);
        assert.equal(st1.args[0], 1);
        assert.equal(st2.args[0], 1);

        ps.pub('a', 'test');
        assert.equal(st1.args[0], 'test');
        assert.equal(st2.args[0], 'test');
    });

    it('pub результат', function(){
        var ps = Latte.PS(),
            f1 = function(v){
                return v + '!';
            },
            f2 = function(v){
                return v + '.';
            },
            f3 = function(v){
                return v + '?';
            };

        ps.sub('a', f1);
        ps.sub('a', f2);
        ps.sub('a', f3);

        assert.deepEqual(ps.pub('a', 'value'), ['value!', 'value.', 'value?']);
        assert.deepEqual(ps.pub('a', 'test'), ['test!', 'test.', 'test?']);

        ps.unsub('a', f2);
        assert.deepEqual(ps.pub('a', 'rest'), ['rest!', 'rest?']);
    });

    it('pub результат без подписчиков', function(){
        var ps = Latte.PS();
        assert.deepEqual(ps.pub('a', 'value'), []);
    });

    it('pub/sub разные события', function(){
        var ps = Latte.PS(),
            st1 = stub(),
            st2 = stub();

        ps.sub('a', st1);
        ps.sub('b', st2);

        assert.equal(st1.called, false);
        assert.equal(st2.called, false);

        ps.pub('a', 1);
        assert.equal(st1.args[0], 1);
        assert.equal(st2.called, false);
        st1.reset();

        ps.pub('b', 'test');
        assert.equal(st1.called, false);
        assert.equal(st2.args[0], 'test');
    });

    it('once', function(){
        var ps = Latte.PS(),
            st = stub('return');

        ps.once('a', st);

        assert.deepEqual(ps.pub('a', 'test'), ['return']);
        assert.equal(st.args[0], 'test');
        st.reset();

        ps.pub('a', 'rest');
        assert.equal(st.called, false);
    });

    it('unsub', function(){
        var ps = Latte.PS(),
            st1 = stub(),
            st2 = stub();

        ps.sub('a', st1);
        ps.sub('b', st2);

        assert.equal(st1.called, false);
        assert.equal(st2.called, false);

        ps.pub('a', 1);
        assert.equal(st1.args[0], 1);
        assert.equal(st2.called, false);
        st1.reset();

        ps.pub('b', 'test');
        assert.equal(st1.called, false);
        assert.equal(st2.args[0], 'test');
        st1.reset();
        st2.reset();

        ps.unsub('a', st1);
        ps.unsub('b', st2);

        ps.pub('a', 12);
        ps.pub('b', 'qwerty');

        assert.equal(st1.called, false);
        assert.equal(st2.called, false);
    });

    it('unsub для незарегистрированного события', function(){
        var ps = Latte.PS();
        ps.unsub('a', function(){});
    });

    it('unsuball', function(){
        var ps = Latte.PS(),
            st1 = stub(),
            st2 = stub();

        ps.sub('a', st1).sub('a', st2);

        ps.pub('a', 'test');

        assert.equal(st1.args[0], 'test');
        assert.equal(st2.args[0], 'test');
        st1.reset();
        st2.reset();

        ps.unsuball('a');

        assert.equal(st1.called, false);
        assert.equal(st2.called, false);
    });

    it('unsuball без подписчиков', function(){
        var ps = Latte.PS();
        ps.unsuball('qwerty');
    });

    it('pub если нет подписчиков', function(){
        var ps = Latte.PS();
        ps.pub('a', 555);
    });

    it('global pub/sub', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.PS.sub('a', st1);
        Latte.PS.sub('a', st2);

        assert.equal(st1.called, false);
        assert.equal(st2.called, false);

        Latte.PS.pub('a', 1);
        assert.equal(st1.args[0], 1);
        assert.equal(st2.args[0], 1);

        Latte.PS.pub('a', 'test');
        assert.equal(st1.args[0], 'test');
        assert.equal(st2.args[0], 'test');

        Latte.PS.unsub('a', st1);
        Latte.PS.unsub('a', st2);
    });

    it('global pub результат', function(){
        var f1 = function(v){
                return v + '!';
            },
            f2 = function(v){
                return v + '.';
            },
            f3 = function(v){
                return v + '?';
            };

        Latte.PS.sub('a', f1);
        Latte.PS.sub('a', f2);
        Latte.PS.sub('a', f3);

        assert.deepEqual(Latte.PS.pub('a', 'value'), ['value!', 'value.', 'value?']);
        assert.deepEqual(Latte.PS.pub('a', 'test'), ['test!', 'test.', 'test?']);

        Latte.PS.unsub('a', f2);
        assert.deepEqual(Latte.PS.pub('a', 'rest'), ['rest!', 'rest?']);

        Latte.PS.unsub('a', f1);
        Latte.PS.unsub('a', f3);

        assert.deepEqual(Latte.PS.pub('a', 'west'), []);
    });

    it('global pub/sub разные события', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.PS.sub('a', st1);
        Latte.PS.sub('b', st2);

        assert.equal(st1.called, false);
        assert.equal(st2.called, false);

        Latte.PS.pub('a', 1);
        assert.equal(st1.args[0], 1);
        assert.equal(st2.called, false);
        st1.reset();

        Latte.PS.pub('b', 'test');
        assert.equal(st1.called, false);
        assert.equal(st2.args[0], 'test');

        Latte.PS.unsub('a', st1);
        Latte.PS.unsub('b', st2);
    });

    it('global once', function(){
        var st = stub('return');

        Latte.PS.once('a', st);

        assert.deepEqual(Latte.PS.pub('a', 'test'), ['return']);
        assert.equal(st.args[0], 'test');
        st.reset();

        Latte.PS.pub('a', 'rest');
        assert.equal(st.called, false);
    });

    it('global unsuball', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.PS.sub('a', st1).sub('a', st2);

        Latte.PS.pub('a', 'test');

        assert.equal(st1.args[0], 'test');
        assert.equal(st2.args[0], 'test');
        st1.reset();
        st2.reset();

        Latte.PS.unsuball('a');

        assert.equal(st1.called, false);
        assert.equal(st2.called, false);
    });

    it('unsuball без подписчиков', function(){
        Latte.PS.unsuball('qwerty');
    });
});

describe('Latte общие', function(){

    it('проверка M', function(){
        assert.equal(Latte.isM(), false);
        assert.equal(Latte.isM(''), false);
        assert.equal(Latte.isM(0), false);
        assert.equal(Latte.isM(NaN), false);
        assert.equal(Latte.isM(null), false);
        assert.equal(Latte.isM({}), false);
        assert.equal(Latte.isM(function(){}), false);

        assert.equal(Latte.isM(Latte.Mv(1)), true);
        assert.equal(Latte.isM(Latte.Mv(Latte.E('e'))), true);
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

    it('проверка A', function(){
        assert.equal(Latte.isA(), false);
        assert.equal(Latte.isA({}), false);
        assert.equal(Latte.isA(function(){}), false);
        assert.equal(Latte.isA(null), false);
        assert.equal(Latte.isA(undefined), false);

        assert.equal(Latte.isA(Latte.A(function(){})), true);
    });

    it('проверка S', function(){
        assert.equal(Latte.isS(), false);
        assert.equal(Latte.isS({}), false);
        assert.equal(Latte.isS(function(){}), false);
        assert.equal(Latte.isS(null), false);
        assert.equal(Latte.isS(undefined), false);

        assert.equal(Latte.isS(Latte.S(function(){})), true);

        assert.equal(Latte.isS(Latte.S.pseq([Latte.S(function(){}), Latte.S(function(){})])), true);
        assert.equal(Latte.isS(Latte.S.plift(function(){}, [Latte.S(function(){}), Latte.S(function(){})])), true);
    });

    it('проверка PS', function(){
        assert.equal(Latte.isPS(), false);
        assert.equal(Latte.isPS({}), false);
        assert.equal(Latte.isPS(function(){}), false);
        assert.equal(Latte.isPS(null), false);
        assert.equal(Latte.isPS(undefined), false);

        assert.equal(Latte.isPS(Latte.PS()), true);
        assert.equal(Latte.isPS(Latte.PS), true);
    });
});

describe('Latte PubSub & Latte Arrow', function(){

    it('PubSub и Arrow', function(){
        var ps = Latte.PS(),
            st = stub();

        ps.sub('a', Latte.A(function(v){
            return Latte.Mv(v + '!!!');
        })).sub('a', Latte.A(function(v){
            return Latte.Mv(v + '???');
        }));

        Latte.M.seq(ps.pub('a', 'test')).always(st);

        assert.deepEqual(st.args[0], ['test!!!', 'test???']);
    });

    it('PubSub и Arrow со значением E', function(){
        var ps = Latte.PS(),
            st = stub();

        ps.sub('a', Latte.A(function(v){
            return Latte.Mv(v + '!!!');
        })).sub('a', Latte.A(function(v){
            return Latte.Mv(Latte.E('e'));
        }));

        Latte.M.seq(ps.pub('a', 'test')).always(st);

        assert.deepEqual(st.args[0](), 'e');
    });
});

describe('Latte PubSub & Latte Stream', function(){

    it('PubSub и Stream', function(){
        var st = stub();

        Latte.S(function(h){
            Latte.PS.sub('a', h);
        }).lift(function(v){
            return v > 5 ? 'ok' : Latte.E('e');
        }).next(st);

        assert.equal(st.called, false);

        assert.deepEqual(Latte.PS.pub('a', 12), [undefined]);

        assert.equal(st.args[0], 'ok');
        st.reset();

        Latte.PS.pub('a', 2);
        assert.equal(st.called, false);
        st.reset();

        Latte.PS.pub('a', 222);
        assert.equal(st.args[0], 'ok');
        st.reset();

        Latte.PS.unsuball('a');
    });

    it('PubSub once и Stream', function(){
        var st = stub();

        Latte.S(function(h){
            Latte.PS.once('a', h);
        }).lift(function(v){
            return v > 5 ? 'ok' : Latte.E('e');
        }).next(st);

        assert.equal(st.called, false);

        assert.deepEqual(Latte.PS.pub('a', 12), [undefined]);

        assert.equal(st.args[0], 'ok');
        st.reset();

        Latte.PS.pub('a', 2);
        assert.equal(st.called, false);

        Latte.PS.pub('a', 222);
        assert.equal(st.called, false);
    });
});
