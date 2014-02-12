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
                return Latte.M(v + '!!!');
            },
            st1 = stub(),
            st2 = stub();

        Latte.M(x).bnd(f).always(st1);
        f(x).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });

    it('f <=< return == f --Alternative Identity', function(){
        var x = 'test',
            f = function(v){
                return Latte.M(v + '!!!');
            },
            st1 = stub(),
            st2 = stub();

        Latte.A(f).bnd(Latte.M)(x).always(st1);
        f(x).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });

    it('return <=< f == f --Alternative Identity 2', function(){
        var x = 'test',
            f = function(v){
                return Latte.M(v + '!!!');
            },
            st1 = stub(),
            st2 = stub();

        Latte.A(Latte.M).bnd(f)(x).always(st1);
        f(x).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });

    it('m >>= return == m --Right identity', function(){
        var x = 'test',
            st1 = stub(),
            st2 = stub();

        Latte.M(x).bnd(Latte.M).always(st1);
        Latte.M(x).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });

    it('m >>= return == m --Right Identity', function(){
        var x = 'test',
            st1 = stub(),
            st2 = stub();

        Latte.M(x).bnd(Latte.M).always(st1);
        Latte.M(x).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });

    it('(m >>= f) >>= g == m >>= (λx -> f x >>= g) --Associativity', function(){
        var x = Latte.M('test'),
            st1 = stub(),
            st2 = stub(),
            f = function(x){
                return Latte.M('[' + x + ']');
            },
            g = function(x){
                return Latte.M('<' + x + '>');
            };

        Latte.M(x).bnd(f).bnd(g).always(st1);
        Latte.M(x).bnd(function(x){
            return f(x).bnd(g);
        }).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });

    it('(f <=< g) <=< h == f <=< (g <=< h) --Alternative Associativity', function(){
        var x = Latte.M('test'),
            st1 = stub(),
            st2 = stub(),
            f = function(x){
                return Latte.M('[' + x + ']');
            },
            g = function(x){
                return Latte.M('<' + x + '>');
            },
            h = function(x){
                return Latte.M('{' + x + '}');
            };

        Latte.A(function(x){
            return Latte.A(f).bnd(g)(x);
        }).bnd(h)(x).always(st1);

        Latte.A(f).bnd(function(x){
            return Latte.A(g).bnd(h)(x);
        })(x).always(st2);

        assert.equal(st1.count, st2.count);
        assert.equal(st1.args[0], st2.args[0]);
    });
});

describe('Latte Monad', function(){

    it('Later вызов с задержкой', function(done){
        var st = stub();

        Latte.M.Later(function(h){
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

        Latte.M.Later(function(h){
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

        Latte.M.Later(function(h){
            h('test');
        }).always(st);

        assert.equal(st.called, true);
        assert.equal(st.args[0], 'test');
    });

    it('Later немедленный вызов c E', function(){
        var st = stub();

        Latte.M.Later(function(h){
            h(Latte.E('error'));
        }).always(st);

        assert.equal(st.called, true);
        assert.equal(st.args[0](), 'error');
    });

    it('Later игнорирование возвращаемого значения', function(done){
        var st = stub();

        Latte.M.Later(function(h){
            setTimeout(function(){
                h('test');
            }, 10);

            return Latte.M('new test');
        }).always(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.args[0], 'test');
            done();
        }, 20);
    });

    it('Later игнорирование повторных вызовов обработчика', function(){
        var st = stub();

        Latte.M.Later(function(h){
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

            l = Latte.M.Later(function(h){
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

        Latte.M.Later(st);

        assert.equal(st.called, true);
    });

    it('Later игнорирование контекста вызова', function(){
        var st = stub();

        Latte.M.Later.call(null, function(h){
            h('test');
        }).always(st);

        assert.equal(st.called, true);
        assert.equal(st.args[0], 'test');
    });

    it('создание значения', function(){
        var st = stub();

        Latte.M('test').always(st);

        assert.equal(st.called, true);
        assert.equal(st.args[0], 'test');
    });

    it('создание E значения', function(){
        var st = stub();

        Latte.M(Latte.E('error')).always(st);

        assert.equal(st.called, true);
        assert.equal(Latte.isE(st.args[0]), true);
    });

    it('always метод', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.M().always(st1);
        Latte.M(Latte.E()).always(st2);

        assert.equal(st1.called, true);
        assert.equal(st2.called, true);
    });

    it('always метод не переопределяет значение', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.M('test').always(function(v){
            return Latte.M('new ' + v);
        }).always(st1);

        Latte.M(Latte.E('error')).always(function(v){
            return v() + '!';
        }).always(st2);

        assert.equal(st1.args[0], 'test');
        assert.equal(st2.args[0](), 'error');
    });

    it('always от одного объекта', function(done){
        var m = Latte.M.Later(function(h){
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

        Latte.M().next(st1);
        Latte.M(Latte.E()).next(st2);

        assert.equal(st1.called, true);
        assert.equal(st2.called, false);
    });

    it('next метод не переопределяет значение', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.M('test').next(function(v){
            return Latte.M('new ' + v);
        }).next(st1);

        Latte.M('test').next(function(v){
            return v + '!';
        }).next(st2);

        assert.equal(st1.args[0], 'test');
        assert.equal(st2.args[0], 'test');
    });

    it('next от одного объекта', function(done){
        var m = Latte.M.Later(function(h){
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

        Latte.M().fail(st1);
        Latte.M(Latte.E()).fail(st2);

        assert.equal(st1.called, false);
        assert.equal(st2.called, true);
    });

    it('fail метод не переопределяет значение', function(){
        var st1 = stub(),
            st2 = stub();

        Latte.M(Latte.E('error')).fail(function(v){
            return Latte.M(Latte.E('new ' + v()));
        }).fail(st1);

        Latte.M(Latte.E('error')).fail(function(v){
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

        Latte.M('test').bnd(function(v){
            return Latte.M(v).bnd(function(v){
                return Latte.M(Latte.E('error')).bnd(fret).fail(st3);
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

        Latte.M('test').lift(function(v){
            return Latte.E('error');
        }).lift(fid).lift(fid).fail(st1).lift(fid).lift(fid).fail(st2);

        assert.equal(fid.called, false);

        assert.equal(st1.called, true);
        assert.equal(st1.args[0](), 'error');
        assert.equal(st2.called, true);
        assert.equal(st2.args[0](), 'error');
    });

    it('fail от одного объекта', function(done){
        var m = Latte.M.Later(function(h){
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

        Latte.M('test').bnd(function(v){
            return Latte.M(v + '!!!');
        }).next(st);

        assert.equal(st.args[0], 'test!!!');
    });

    it('bnd метод возвращает E', function(){
        var st = stub();

        Latte.M('test').bnd(function(v){
            return Latte.M(Latte.E('error ' + v));
        }).fail(st);

        assert.equal(st.args[0](), 'error test');
    });

    it('bnd не вызывается при E', function(){
        var st = stub();

        Latte.M('test').bnd(function(v){
            return Latte.M(Latte.E('error'));
        }).bnd(st);

        assert.equal(st.called, false);
    });

    it('bnd вложенные вызовы', function(){
        var st1 = stub(),
            st2 = stub(),
            st3 = stub(),
            st4 = stub();

        Latte.M('test').bnd(function(v){
            return Latte.M(v + '!');
        }).bnd(function(v){
                return Latte.M(v).bnd(function(newV){
                    return Latte.M('[' + newV + ']').bnd(function(newV2){
                        return Latte.M('<' + newV2 + '>').next(st4);
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

        Latte.M('test').lift(function(v){
            return v + '!!';
        }).lift(function(v){
                return v + '!';
            }).next(st);

        assert.equal(st.args[0], 'test!!!');
    });

    it('lift метод возвращает E', function(){
        var st = stub();

        Latte.M('test').lift(function(v){
            return Latte.E('error ' + v);
        }).fail(st);

        assert.equal(st.args[0](), 'error test');
    });

    it('lift метод не вызывается при E', function(){
        var st = stub();

        Latte.M('test').lift(function(v){
            return Latte.E('error ' + v);
        }).lift(st);

        assert.equal(st.called, false);
    });

    it('raise', function(){
        var st = stub(),
            st2 = stub();

        Latte.M(Latte.E('e')).raise(function(e){
            return 'new ' + e();
        }).fail(st).always(st2);

        assert.equal(st.args[0](), 'new e');
        assert.equal(st2.args[0](), 'new e');
    });

    it('raise не вызывается при отсутствии E значения', function(){
        var st = stub(),
            st2 = stub();

        Latte.M('test').raise(st).always(st2);

        assert.equal(st.called, false);
        assert.equal(st2.args[0], 'test');
    });

    it('seq', function(){
        var st = stub();
        Latte.M(1).seq([Latte.M(2), Latte.M(3)]).always(st);
        assert.deepEqual(st.args[0], [1,2,3]);
    });

    it('seq c пустым массивом', function(){
        var st = stub();
        Latte.M(1).seq([]).always(st);
        assert.deepEqual(st.args[0], [1]);
    });

    it('seq co значением E в массиве', function(){
        var st = stub();
        Latte.M(1).seq([Latte.M(Latte.E('e')), Latte.M(3)]).always(st);
        assert.equal(st.args[0](), 'e');
    });

    it('seq от значения E', function(){
        var st = stub();
        Latte.M(Latte.E('e')).seq([Latte.M(1), Latte.M(2)]).always(st);
        assert.equal(st.args[0](), 'e');
    });

    it('seq последовательность результатов', function(done){
        var st = stub(),
            m1 = Latte.M.Later(function(h){
                setTimeout(function(){
                    h(1);
                }, 20);
            }),
            m2 = Latte.M(2),
            m3 = Latte.M.Later(function(h){
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
        }, 0, [Latte.M(1), Latte.M(2), Latte.M(3)]).always(st);

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
        }, 0, [Latte.M(1), Latte.M(Latte.E('e')), Latte.M(3)]).always(st);

        assert.equal(st.args[0](), 'e');
    });

    it('static seq пустой массив', function(){
        var st = stub();
        Latte.M.seq([]).always(st);
        assert.deepEqual(st.args[0], []);
    });

    it('allseq', function(){
        var st = stub();
        Latte.M.allseq([Latte.M(1), Latte.M(2), Latte.M(3)]).always(st);
        assert.deepEqual(st.args[0], [1,2,3]);
    });

    it('allseq пустой массив', function(){
        var st = stub();
        Latte.M.allseq([]).always(st);
        assert.deepEqual(st.args[0], []);
    });

    it('allseq co значением E в массиве', function(){
        var st = stub();

        Latte.M.allseq([Latte.M(1), Latte.M(Latte.E('e')), Latte.M(3)]).always(st);

        assert.equal(st.args[0].length, 3);

        assert.equal(st.args[0][0], 1);
        assert.equal(st.args[0][1](), 'e');
        assert.equal(st.args[0][2], 3);
    });

    it('static lift', function(){
        var st = stub();

        Latte.M.lift(function(a){
            return a + '!!!';
        }, [Latte.M('test')]).always(st);

        assert.equal(st.args[0], 'test!!!');
    });

    it('static lift массив с несколькими элементами', function(){
        var st = stub();

        Latte.M.lift(function(a, b, c){
            return a + b + c;
        }, [Latte.M('test'), Latte.M(' '), Latte.M('Latte')]).always(st);

        assert.equal(st.args[0], 'test Latte');
    });

    it('static lift массив с несколькими элементами и значением E', function(){
        var st = stub();

        Latte.M.lift(function(a, b, c){
            return a + b + c;
        }, [Latte.M('test'), Latte.M(' '), Latte.M(Latte.E('e'))]).always(st);

        assert.equal(st.args[0](), 'e');
    });
});

describe('Latte Arrow', function(){

    it('bnd', function(){
        var st = stub();

        Latte.A(Latte.M).bnd(function(x){
            return Latte.M(x + 'b');
        }).bnd(function(x){
                return Latte.M(x + 'c');
            })('a').always(st);

        assert.equal(st.args[0], 'abc');
    });

    it('bnd со значением E', function(){
        var st = stub();

        Latte.A(Latte.M).bnd(function(x){
            return Latte.M(Latte.E('e'));
        }).bnd(function(x){
                return Latte.M(x + 'c');
            })('a').always(st);

        assert.equal(st.args[0](), 'e');
    });

    it('lift', function(){
        var st = stub();

        Latte.A(Latte.M).lift(function(x){
            return x + 'b';
        }).lift(function(x){
                return x + 'c';
            })('a').always(st);

        assert.equal(st.args[0], 'abc');
    });

    it('lift со значением E', function(){
        var st = stub();

        Latte.A(Latte.M).lift(function(x){
            return Latte.E('e');
        }).lift(function(x){
                return x + 'c';
            })('a').always(st);

        assert.equal(st.args[0](), 'e');
    });

    it('lift и bnd', function(){
        var st = stub();

        Latte.A(Latte.M).lift(function(x){
            return x + 'b';
        }).bnd(function(x){
                return Latte.M(x + 'c');
            }).lift(function(x){
                return x + 'd';
            })('a').always(st);

        assert.equal(st.args[0], 'abcd');
    });

    it('lift и bnd cо значением E', function(){
        var st = stub();

        Latte.A(Latte.M).lift(function(x){
            return x + 'b';
        }).bnd(function(x){
                return Latte.M(Latte.E('e'));
            }).lift(function(x){
                return x + 'd';
            })('a').always(st);

        assert.equal(st.args[0](), 'e');
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

        assert.equal(Latte.isM(Latte.M(1)), true);
        assert.equal(Latte.isM(Latte.M(Latte.E('e'))), true);
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
});