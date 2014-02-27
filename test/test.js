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

    it('Mh', function(){
        var st = stub(),
            m = Latte.Mh();

        m.hand('test');
        m.inst.always(st);

        assert.equal(st.args[0], 'test');
    });

    it('Mh вызов hand несколько раз', function(){
        var st = stub(),
            m = Latte.Mh();

        m.inst.always(st);

        m.hand('test');
        m.hand('rest');
        m.hand('west');

        assert.equal(st.args[0], 'test');
    });

    it('Mh и значение E', function(){
        var st = stub(),
            m = Latte.Mh();

        m.hand(Latte.E('e'));
        m.inst.always(st);

        assert.equal(st.args[0](), 'e');
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
        }).bnd(function(v){
            return Latte.Mv('[' + v + ']');
        }).bnd(function(v){
            return Latte.Mv('<' + v + '>');
        }).always(st);

        assert.equal(st.args[0], '<[test!!!]>');
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

    it('bnd и другая стрелка', function(){
        var st = stub();

        Latte.A(Latte.Mv).bnd(function(x){
            return Latte.Mv(x + 'b');
        }).bnd(Latte.A(function(x){
            return Latte.Mv(x + 'c');
        }))('a').always(st);

        assert.equal(st.args[0], 'abc');
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
            h(1);
        }).always(st);

        assert.equal(st.called, false);

        handle(2);
        assert.equal(st.args[0], 2);

        handle(24);
        assert.equal(st.args[0], 24);

        handle(Latte.E('e'));
        assert.equal(st.args[0](), 'e');

        assert.equal(st.count, 3);
    });

    it('SH always', function(){
        var st = stub(),
            handle;

        Latte.SH(function(h){
            handle = h;
            h(1);
        }).always(st);

        assert.equal(st.args[0], 1);

        handle(2);
        assert.equal(st.args[0], 2);

        handle(24);
        assert.equal(st.args[0], 24);

        handle(Latte.E('e'));
        assert.equal(st.args[0](), 'e');

        assert.equal(st.count, 4);

    });

    it('Sh always', function(){
        var st = stub(),
            s = Latte.Sh();

        s.inst.always(st);

        s.hand(1);
        assert.equal(st.args[0], 1);

        s.hand(2);
        assert.equal(st.args[0], 2);

        s.hand(24);
        assert.equal(st.args[0], 24);

        s.hand(Latte.E('e'));
        assert.equal(st.args[0](), 'e');

        assert.equal(st.count, 4);

    });

    it('SHh always', function(){
        var st = stub(),
            s = Latte.SHh();

        s.inst.always(st);

        s.hand(1);
        assert.equal(st.args[0], 1);

        s.hand(2);
        assert.equal(st.args[0], 2);

        s.hand(24);
        assert.equal(st.args[0], 24);

        s.hand(Latte.E('e'));
        assert.equal(st.args[0](), 'e');

        assert.equal(st.count, 4);
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
            h(Latte.E('error'));
        }).fail(st);

        assert.equal(st.called, false);

        handle(2);
        assert.equal(st.called, false);

        handle(24);
        assert.equal(st.called, false);

        handle(Latte.E('e'));

        assert.equal(st.args[0](), 'e');
    });

    it('SH fail', function(){
        var st = stub(),
            handle;

        Latte.SH(function(h){
            handle = h;
            h(Latte.E('error'));
        }).fail(st);

        assert.equal(st.args[0](), 'error');
        st.reset();

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

    it('SH bnd', function(){
        var st = stub(),
            handle;

        Latte.SH(function(h){
            handle = h;
            h(1);
        }).bnd(function(v){
            return Latte.Mv(v + 5);
        }).always(st);

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

    it('SH bnd вложенные вызовы', function(){
        var st = stub(),
            handle;

        Latte.SH(function(h){
            handle = h;
            h(1);
        }).bnd(function(v){
            return Latte.Mv(v).bnd(function(nv){
                return Latte.Mv('[' + nv + ']');
            });
        }).always(st);

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

    it('SH lift', function(){
        var st = stub(),
            handle;

        Latte.SH(function(h){
            handle = h;
            h(1);
        }).lift(function(v){
            return v + 5;
        }).lift(function(v){
            return '(' + v + ')';
        }).always(st);

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

    it('SH raise', function(){
        var st = stub(),
            handle;

        Latte.SH(function(h){
            handle = h;
            handle(1);
        }).raise(function(e){
            return 'err: ' + e();
        }).always(st);

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

    it('SH и static seq', function(){
        var st = stub(),
            st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            s1 = Latte.SH(function(h){
                h(1);
            }).always(st1),
            s2 = Latte.SH(function(h){
                h(2);
            }).always(st2),
            s3 = Latte.SH(function(h){
                h(3);
            }).always(st3);

        Latte.S.seq([s1,s2,s3]).always(st);

        assert.deepEqual(st.called, false);

        assert.equal(st1.args[0], 1);
        assert.equal(st2.args[0], 2);
        assert.equal(st3.args[0], 3);
    });

    it('SH и static SH seq', function(){
        var st = stub(),
            s1 = Latte.SH(function(h){
                h(1);
            }),
            s2 = Latte.SH(function(h){
                h(2);
            }),
            s3 = Latte.SH(function(h){
                h(3);
            });

        Latte.SH.seq([s1,s2,s3]).always(st);

        assert.deepEqual(st.args[0], [1,2,3]);
    });

    it('S и static SH seq', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
                h(1);
            }),
            s2 = Latte.S(function(h){
                handle2 = h;
                h(2);
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
                h(3);
            });

        Latte.SH.seq([s1,s2,s3]).always(st);

        assert.deepEqual(st.called, false);

        handle1(1);
        handle2(2);
        assert.deepEqual(st.called, false);

        handle3(3);
        assert.deepEqual(st.args[0], [1,2,3]);
    });

    it('S и SH и static SH seq', function(){
        var st = stub(),
            handle1,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
                h(1);
            }),
            s2 = Latte.SH(function(h){
                h(2);
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
                h(3);
            });

        Latte.SH.seq([s1,s2,s3]).always(st);

        assert.deepEqual(st.called, false);

        handle1(1);
        assert.deepEqual(st.called, false);

        handle3(3);
        assert.deepEqual(st.args[0], [1,2,3]);
    });

    it('S и SH и static S seq', function(){
        var st = stub(),
            handle1,
            handle3,
            s1 = Latte.S(function(h){
                handle1 = h;
                h(1);
            }),
            s2 = Latte.SH(function(h){
                h(2);
            }),
            s3 = Latte.S(function(h){
                handle3 = h;
                h(3);
            });

        Latte.S.seq([s1,s2,s3]).always(st);

        assert.deepEqual(st.called, false);

        handle1(1);
        assert.deepEqual(st.called, false);

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

    it('SH static allseq', function(){
        var st = stub(),
            s1 = Latte.SH(function(h){
                h(1);
            }),
            s2 = Latte.SH(function(h){
                h(2);
            }),
            s3 = Latte.SH(function(h){
                h(3);
            });

        Latte.SH.allseq([s1,s2,s3]).always(st);

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

    it('SH static fold', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.SH(function(h){
                handle1 = h;
                h(1);
            }),
            s2 = Latte.SH(function(h){
                handle2 = h;
                h(2);
            }),
            s3 = Latte.SH(function(h){
                handle3 = h;
                h(3);
            });

        Latte.SH.fold(function(acc, v){
            return acc += v;
        }, 0, [s1,s2,s3]).always(st);

        assert.equal(st.args[0], 6);

        handle1(2);
        assert.equal(st.args[0], 6);
        handle2(3);
        assert.equal(st.args[0], 6);
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

    it('SH static lift', function(){
        var st = stub(),
            s1 = Latte.SH(function(h){
                h(1);
            }),
            s2 = Latte.SH(function(h){
                h(2);
            }),
            s3 = Latte.SH(function(h){
                h(3);
            });

        Latte.SH.lift(function(a,b,c){
            return a + b + c;
        }, [s1,s2,s3]).always(st);

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

    it('SH static any', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.SH(function(h){
                h('first');
                handle1 = h;
            }),
            s2 = Latte.SH(function(h){
                handle2 = h;
            }),
            s3 = Latte.SH(function(h){
                handle3 = h;
            });

        Latte.SH.any([s1, s2, s3]).always(st);

        assert.equal(st.args[0], 'first');

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

    it('SH static pallseq', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.SH(function(h){
                handle1 = h;
            }),
            s2 = Latte.SH(function(h){
                handle2 = h;
            }),
            s3 = Latte.SH(function(h){
                handle3 = h;
                h(3);
            });

        Latte.SH.pallseq([s1,s2,s3]).always(st);

        handle1(11);
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

    it('SH static pseq', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.SH(function(h){
                handle1 = h;
            }),
            s2 = Latte.SH(function(h){
                handle2 = h;
                h(2);
            }),
            s3 = Latte.SH(function(h){
                handle3 = h;
            });

        Latte.SH.pseq([s1,s2,s3]).always(st);

        handle1(11);
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

    it('SH static pfold', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.SH(function(h){
                handle1 = h;
            }),
            s2 = Latte.SH(function(h){
                handle2 = h;
                h(2);
            }),
            s3 = Latte.SH(function(h){
                handle3 = h;
            });

        Latte.SH.pfold(function(acc, v){
            return acc += v;
        }, 0, [s1,s2,s3]).always(st);

        handle1(1);
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

    it('SH static plift', function(){
        var st = stub(),
            handle1,
            handle2,
            handle3,
            s1 = Latte.SH(function(h){
                handle1 = h;
            }),
            s2 = Latte.SH(function(h){
                handle2 = h;
                h(2);
            }),
            s3 = Latte.SH(function(h){
                handle3 = h;
            });

        Latte.SH.plift(function(a,b,c){
            return a + b + c;
        }, [s1,s2,s3]).always(st);

        handle1(1);
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

describe('Latte common', function(){

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

        assert.equal(Latte.isS(Latte.S.pseq([Latte.S(function(){})])), true);
        assert.equal(Latte.isS(Latte.S.plift(function(){}, [Latte.S(function(){})])), true);

        assert.equal(Latte.isS(Latte.SH(function(){})), true);
    });
});

describe('Latte Stream & Latte Monad', function(){

    it('Монады и потоки в операциях со списками', function(){
        var st = stub(),
            handle1,
            handle2,
            sh = Latte.SH(function(h){
                handle1 = h;
                h(1);
            }),
            s = Latte.S(function(h){
                handle2 = h;
            }),
            m = Latte.Mv(3);

        Latte.S.pseq([sh, s, m]).always(st);

        assert.equal(st.called, false);

        handle2(2);
        assert.deepEqual(st.args[0], [1,2,3]);

        handle1(11);
        assert.deepEqual(st.args[0], [11,2,3]);
    });
});

describe('Latte Stream & Latte Arrow', function(){

    it('Вызов стрелки из потока', function(){
        var st = stub(),
            a = Latte.A(Latte.Mv).lift(function(v){
                return '[' + v + ']';
            });

        Latte.SH(function(h){
            h('test');
        }).bnd(a).always(st);

        assert.equal(st.args[0], '[test]');
    });

    it('Стрелка как инициализатор потока', function(){
        var st = stub(),
            a = Latte.A(Latte.Mv).lift(function(v){
                return '[' + v + ']';
            });

        Latte.SH(function(h){
            a('test').always(h);
        }).always(st);

        assert.equal(st.args[0], '[test]');
    });

    it('Вызов потока хранящего состояние из стрелки', function(done){
        var s = Latte.SH(function(h){
                h(1);

                setTimeout(function(){
                    h(2);
                }, 1);
            }),

            a = Latte.A(function(){
                return s.lift(function(v){
                    return 'value: ' + v;
                });
            }),
            st = stub();

        a().always(st);
        assert.equal(st.args[0], 'value: 1');

        setTimeout(function(){
            a().always(st);
            assert.equal(st.args[0], 'value: 2');

            done();
        }, 2);
    })

});
