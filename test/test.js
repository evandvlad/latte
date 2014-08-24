/**
 * Autor: Evstigneev Andrey
 * Date: 05.02.14
 * Time: 22:52
 */

var assert = require("assert"),
    Latte = require("../latte.js"),
    fspy = require("./fspy.js");

describe('Monadic Laws', function(){

    it('(return x) >>= f == f x --Left Identity', function(done){
        var x = 'test',
            f = function(v){
                return Latte.M.Pack(v + '!!!');
            },
            st1 = fspy(),
            st2 = fspy();

        Latte.M.Pack(x).bnd(f).always(st1);
        f(x).always(st2);

        setTimeout(function(){
            assert.equal(st1.count, st2.count);
            assert.equal(st1.args[0], st2.args[0]);
            done();
        }, 50);
    });

    it('m >>= return == m --Right identity', function(done){
        var x = 'test',
            st1 = fspy(),
            st2 = fspy();

        Latte.M.Pack(x).bnd(Latte.M.Pack.bind(Latte.M)).always(st1);
        Latte.M.Pack(x).always(st2);

        setTimeout(function(){
            assert.equal(st1.count, st2.count);
            assert.equal(st1.args[0], st2.args[0]);
            done();
        }, 60);
    });

    it('m >>= return == m --Right Identity', function(done){
        var x = 'test',
            st1 = fspy(),
            st2 = fspy();

        Latte.M.Pack(x).bnd(Latte.M.Pack.bind(Latte.M)).always(st1);
        Latte.M.Pack(x).always(st2);

        setTimeout(function(){
            assert.equal(st1.count, st2.count);
            assert.equal(st1.args[0], st2.args[0]);
            done();
        }, 40)
    });

    it('(m >>= f) >>= g == m >>= (λx -> f x >>= g) --Associativity', function(done){
        var x = Latte.M.Pack('test'),
            st1 = fspy(),
            st2 = fspy(),
            f = function(x){
                return Latte.M.Pack('[' + x + ']');
            },
            g = function(x){
                return Latte.M.Pack('<' + x + '>');
            };

        Latte.M.Pack(x).bnd(f).bnd(g).always(st1);
        Latte.M.Pack(x).bnd(function(x){
            return f(x).bnd(g);
        }).always(st2);

        setTimeout(function(){
            assert.equal(st1.count, st2.count);
            assert.equal(st1.args[0], st2.args[0]);
            done();
        }, 80);
    });
});

describe('Latte Monad', function(){

    it('M', function(done){
        var st = fspy();

        Latte.M(function(h){
            setTimeout(function(){
                h('test');
            }, 0);
        }).always(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.count, 1);
            assert.equal(st.args.length, 1);
            assert.equal(st.args[0], 'test');
            done();
        }, 80);
    });

    it('M со значением E', function(done){
        var st = fspy();

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
        }, 40);
    });

    it('M немедленный вызов', function(done){
        var st = fspy();

        Latte.M(function(h){
            h('test');
        }).always(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.args[0], 'test');
            done();
        }, 50);
    });

    it('M немедленный вызов cо значением E', function(done){
        var st = fspy();

        Latte.M(function(h){
            h(Latte.E('error'));
        }).always(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.args[0](), 'error');
            done();
        }, 10);
    });

    it('M игнорирование возвращаемого значения', function(done){
        var st = fspy();

        Latte.M(function(h){
            setTimeout(function(){
                h('test');
            }, 10);

            return Latte.M.Pack('new test');
        }).always(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.args[0], 'test');
            done();
        }, 50);
    });

    it('M игнорирование повторных вызовов обработчика', function(done){
        var st = fspy();

        Latte.M(function(h){
            h('test');
            h('test-1');
            h(Latte.E('error'));
        }).always(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.args[0], 'test');
            done();
        }, 10);
    });

    it('M вызов функции только один раз', function(done){
        var st = fspy(),
            f = function(){},

            l = Latte.M(function(h){
                h('test');
                st();
            });

        l.always(f);
        l.always(f);
        l.always(f);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.count, 1);
            done();
        }, 10);
    });

    it('M немедленный вызов функции', function(done){
        var st = fspy();

        Latte.M(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            done();
        }, 10);
    });

    it('M игнорирование контекста вызова', function(done){
        var st = fspy();

        Latte.M.call(null, function(h){
            h('test');
        }).always(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.args[0], 'test');
            done();
        }, 10);
    });

    it('pack создание значения', function(done){
        var st = fspy();

        Latte.M.Pack('test').always(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.args[0], 'test');
            done();
        }, 10);
    });

    it('pack создание E значения', function(done){
        var st = fspy();

        Latte.M.Pack(Latte.E('error')).always(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(Latte.isE(st.args[0]), true);
            done();
        }, 10);
    });

    it('Hand', function(done){
        var st = fspy(),
            m = Latte.M.Hand();

        m.hand('test');
        m.inst.always(st);

        setTimeout(function(){
            assert.equal(st.args[0], 'test');
            done();
        }, 10);
    });

    it('Hand вызов hand несколько раз', function(done){
        var st = fspy(),
            m = Latte.M.Hand();

        m.inst.always(st);

        m.hand('test');
        m.hand('rest');
        m.hand('west');

        setTimeout(function(){
            assert.equal(st.args[0], 'test');
            done();
        }, 10);
    });

    it('Hand и значение E', function(done){
        var st = fspy(),
            m = Latte.M.Hand();

        m.hand(Latte.E('e'));
        m.inst.always(st);

        setTimeout(function(){
            assert.equal(st.args[0](), 'e');
            done();
        }, 10);
    });

    it('always', function(done){
        var st1 = fspy(),
            st2 = fspy();

        Latte.M.Pack().always(st1);
        Latte.M.Pack(Latte.E()).always(st2);

        setTimeout(function(){
            assert.equal(st1.called, true);
            assert.equal(st2.called, true);
            done();
        }, 10);
    });

    it('always метод не переопределяет значение', function(done){
        var st1 = fspy(),
            st2 = fspy();

        Latte.M.Pack('test').always(function(v){
            return Latte.M.Pack('new ' + v);
        }).always(st1);

        Latte.M.Pack(Latte.E('error')).always(function(v){
            return v() + '!';
        }).always(st2);

        setTimeout(function(){
            assert.equal(st1.args[0], 'test');
            assert.equal(st2.args[0](), 'error');
            done();
        }, 10);
    });

    it('always от одного объекта', function(done){
        var m = Latte.M(function(h){
                setTimeout(function(){
                    h('test');
                }, 0);
            }),
            st1 = fspy(),
            st2 = fspy(),
            st3 = fspy(),
            st4 = fspy();

        m.always(st1).always(st2);
        m.always(st3).always(st4);

        setTimeout(function(){
            assert.equal(st1.args[0], 'test');
            assert.equal(st2.args[0], 'test');
            assert.equal(st3.args[0], 'test');
            assert.equal(st4.args[0], 'test');

            done();
        }, 60);
    });

    it('always context', function(done){
        var m = Latte.M(function(h){
                setTimeout(function(){
                    h('test');
                }, 10);
            }),
            ctx = {v : '-1'},
            r;

        m.always(function(v){
            r = v + this.v;
        }, ctx);

        setTimeout(function(){
            assert.equal(r, 'test-1');
            done();
        }, 30);
    });

    it('next', function(done){
        var st1 = fspy(),
            st2 = fspy();

        Latte.M.Pack().next(st1);
        Latte.M.Pack(Latte.E()).next(st2);

        setTimeout(function(){
            assert.equal(st1.called, true);
            assert.equal(st2.called, false);
            done();
        }, 10);
    });

    it('next метод не переопределяет значение', function(done){
        var st1 = fspy(),
            st2 = fspy();

        Latte.M.Pack('test').next(function(v){
            return Latte.M.Pack('new ' + v);
        }).next(st1);

        Latte.M.Pack('test').next(function(v){
            return v + '!';
        }).next(st2);

        setTimeout(function(){
            assert.equal(st1.args[0], 'test');
            assert.equal(st2.args[0], 'test');
            done();
        }, 10);
    });

    it('next от одного объекта', function(done){
        var m = Latte.M(function(h){
                setTimeout(function(){
                    h('test');
                }, 0);
            }),
            st1 = fspy(),
            st2 = fspy(),
            st3 = fspy(),
            st4 = fspy();

        m.next(st1).next(st2);
        m.next(st3).next(st4);

        setTimeout(function(){
            assert.equal(st1.args[0], 'test');
            assert.equal(st2.args[0], 'test');
            assert.equal(st3.args[0], 'test');
            assert.equal(st4.args[0], 'test');
            done();
        }, 80);
    });

    it('next context', function(done){
        var m = Latte.M(function(h){
                setTimeout(function(){
                    h('test');
                }, 0);
            }),
            ctx = {v : '-1'},
            r;

        m.next(function(v){
            r = v + this.v;
        }, ctx);

        setTimeout(function(){
            assert.equal(r, 'test-1');
            done();
        }, 80);
    });

    it('fail', function(done){
        var st1 = fspy(),
            st2 = fspy();

        Latte.M.Pack().fail(st1);
        Latte.M.Pack(Latte.E()).fail(st2);

        setTimeout(function(){
            assert.equal(st1.called, false);
            assert.equal(st2.called, true);
            done();
        }, 10);
    });

    it('fail метод не переопределяет значение', function(done){
        var st1 = fspy(),
            st2 = fspy();

        Latte.M.Pack(Latte.E('error')).fail(function(v){
            return Latte.M.Pack(Latte.E('new ' + v()));
        }).fail(st1);

        Latte.M.Pack(Latte.E('error')).fail(function(v){
            return v() + '!';
        }).fail(st2);

        setTimeout(function(){
            assert.equal(st1.args[0](), 'error');
            assert.equal(st2.args[0](), 'error');
            done();
        }, 10);
    });

    it('fail продолжения с bnd', function(done){
        var fret = fspy(),
            st1 = fspy(),
            st2 = fspy(),
            st3 = fspy(),
            st4 = fspy();

        Latte.M.Pack('test').bnd(function(v){
            return Latte.M.Pack(v).bnd(function(v){
                return Latte.M.Pack(Latte.E('error')).bnd(fret).fail(st3);
            }).bnd(fret).fail(st4);
        }).bnd(fret).bnd(fret).fail(st1).bnd(fret).bnd(fret).fail(st2);

        setTimeout(function(){
            assert.equal(fret.called, false);

            assert.equal(st1.called, true);
            assert.equal(st1.args[0](), 'error');
            assert.equal(st2.called, true);
            assert.equal(st2.args[0](), 'error');
            assert.equal(st3.called, true);
            assert.equal(st3.args[0](), 'error');
            assert.equal(st4.called, true);
            assert.equal(st4.args[0](), 'error');

            done();
        }, 150);
    });

    it('fail продолжения с lift', function(done){
        var fid = fspy(),
            st1 = fspy(),
            st2 = fspy();

        Latte.M.Pack('test').lift(function(v){
            return Latte.E('error');
        }).lift(fid).lift(fid).fail(st1).lift(fid).lift(fid).fail(st2);

        setTimeout(function(){
            assert.equal(fid.called, false);

            assert.equal(st1.called, true);
            assert.equal(st1.args[0](), 'error');
            assert.equal(st2.called, true);
            assert.equal(st2.args[0](), 'error');

            done();
        }, 10);
    });

    it('fail от одного объекта', function(done){
        var m = Latte.M(function(h){
                setTimeout(function(){
                    h(Latte.E('error'));
                }, 0);
            }),
            st1 = fspy(),
            st2 = fspy(),
            st3 = fspy(),
            st4 = fspy();

        m.fail(st1).fail(st2);
        m.fail(st3).fail(st4);

        setTimeout(function(){
            assert.equal(st1.args[0](), 'error');
            assert.equal(st2.args[0](), 'error');
            assert.equal(st3.args[0](), 'error');
            assert.equal(st4.args[0](), 'error');

            done();
        }, 80);
    });

    it('fail context', function(done){
        var m = Latte.M(function(h){
                setTimeout(function(){
                    h(Latte.E('test'));
                }, 0);
            }),
            ctx = {v : '-1'},
            r;

        m.fail(function(v){
            r = v() + this.v;
        }, ctx);

        setTimeout(function(){
            assert.equal(r, 'test-1');
            done();
        }, 80);
    });

    it('bnd', function(done){
        var st = fspy();

        Latte.M.Pack('test').bnd(function(v){
            return Latte.M.Pack(v + '!!!');
        }).bnd(function(v){
            return Latte.M.Pack('[' + v + ']');
        }).bnd(function(v){
            return Latte.M.Pack('<' + v + '>');
        }).always(st);

        setTimeout(function(){
            assert.equal(st.args[0], '<[test!!!]>');
            done();
        }, 80);
    });

    it('bnd context', function(done){
        var m = Latte.M(function(h){
                setTimeout(function(){
                    h('test');
                }, 0);
            }),
            ctx = {v : '-1'},
            r;

        m.bnd(function(v){
            return Latte.M.Pack(v + this.v);
        }, ctx).always(function(v){
            r = v;
        });

        setTimeout(function(){
            assert.equal(r, 'test-1');
            done();
        }, 80);
    });

    it('bnd метод возвращает E', function(done){
        var st = fspy();

        Latte.M.Pack('test').bnd(function(v){
            return Latte.M.Pack(Latte.E('error ' + v));
        }).fail(st);

        setTimeout(function(){
            assert.equal(st.args[0](), 'error test');
            done();
        }, 80);
    });

    it('bnd не вызывается при E', function(done){
        var st = fspy();

        Latte.M.Pack('test').bnd(function(v){
            return Latte.M.Pack(Latte.E('error'));
        }).bnd(st);

        setTimeout(function(){
            assert.equal(st.called, false);
            done();
        }, 10);
    });

    it('bnd вложенные вызовы', function(done){
        var st1 = fspy(),
            st2 = fspy(),
            st3 = fspy(),
            st4 = fspy();

        Latte.M.Pack('test').bnd(function(v){
            return Latte.M.Pack(v + '!');
        }).bnd(function(v){
                return Latte.M.Pack(v).bnd(function(newV){
                    return Latte.M.Pack('[' + newV + ']').bnd(function(newV2){
                        return Latte.M.Pack('<' + newV2 + '>').next(st4);
                    }).next(st3);
                }).next(st2);
            }).next(st1);

        setTimeout(function(){
            assert.equal(st1.args[0], '<[test!]>');
            assert.equal(st2.args[0], '<[test!]>');
            assert.equal(st3.args[0], '<[test!]>');
            assert.equal(st4.args[0], '<[test!]>');

            done();
        }, 140);
    });

    it('lift', function(done){
        var st = fspy();

        Latte.M.Pack('test').lift(function(v){
            return v + '!!';
        }).lift(function(v){
            return v + '!';
        }).next(st);

        setTimeout(function(){
            assert.equal(st.args[0], 'test!!!');
            done();
        }, 10);
    });

    it('lift метод возвращает E', function(done){
        var st = fspy();

        Latte.M.Pack('test').lift(function(v){
            return Latte.E('error ' + v);
        }).fail(st);

        setTimeout(function(){
            assert.equal(st.args[0](), 'error test');
            done();
        }, 10);
    });

    it('lift метод не вызывается при E', function(done){
        var st = fspy();

        Latte.M.Pack('test').lift(function(v){
            return Latte.E('error ' + v);
        }).lift(st);

        setTimeout(function(){
            assert.equal(st.called, false);
            done();
        }, 10);
    });

    it('lift context', function(done){
        var m = Latte.M(function(h){
                setTimeout(function(){
                    h('test');
                }, 0);
            }),
            ctx = {v : '-1'},
            r;

        m.lift(function(v){
            return v + this.v;
        }, ctx).always(function(v){
            r = v;
        });

        setTimeout(function(){
            assert.equal(r, 'test-1');
            done();
        }, 80);
    });

    it('when', function(done){
        var st1 = fspy(),
            st2 = fspy(),
            st3 = fspy(),
            st4 = fspy(),
            st5 = fspy(),
            st6 = fspy();

        function predicate(v){
            return v > 6;
        }

        Latte.M.Pack(12).when(predicate).always(st1).next(st2).fail(st3);
        Latte.M.Pack(1).when(predicate).always(st4).next(st5).fail(st6);

        setTimeout(function(){
            assert.equal(st1.args[0], 12);
            assert.equal(st2.args[0], 12);
            assert.equal(st3.called, false);
            assert.equal(st4.called, false);
            assert.equal(st5.called, false);
            assert.equal(st6.called, false);

            done();
        }, 10);
    });

    it('when от значения E', function(done){
        var st = fspy(),
            st2 = fspy(),
            st3 = fspy();

        Latte.M.Pack(Latte.E(11)).when(st).always(st2).fail(st3);

        setTimeout(function(){
            assert.equal(st.called, false);
            assert.equal(st2.called, false);
            assert.equal(st3.called, false);

            done();
        }, 10);
    });

    it('when context', function(done){
        var m = Latte.M(function(h){
                setTimeout(function(){
                    h('test');
                }, 10);
            }),
            ctx = {v : true},
            r;

        m.when(function(v){
            return this.v;
        }, ctx).always(function(v){
            r = v;
        });

        setTimeout(function(){
            assert.equal(r, 'test');
            done();
        }, 40);
    });

    it('unless', function(done){
        var st1 = fspy(),
            st2 = fspy(),
            st3 = fspy(),
            st4 = fspy(),
            st5 = fspy(),
            st6 = fspy();

        function predicate(v){
            return v > 6;
        }

        Latte.M.Pack(1).unless(predicate).always(st1).next(st2).fail(st3);
        Latte.M.Pack(12).unless(predicate).always(st4).next(st5).fail(st6);

        setTimeout(function(){
            assert.equal(st1.args[0], 1);
            assert.equal(st2.args[0], 1);
            assert.equal(st3.called, false);
            assert.equal(st4.called, false);
            assert.equal(st5.called, false);
            assert.equal(st6.called, false);

            done();
        }, 10);
    });

    it('unless от значения E', function(done){
        var st = fspy(),
            st2 = fspy(),
            st3 = fspy();

        Latte.M.Pack(Latte.E(11)).unless(st).always(st2).fail(st3);

        setTimeout(function(){
            assert.equal(st.called, false);
            assert.equal(st2.called, false);
            assert.equal(st3.called, false);

            done();
        }, 10);
    });

    it('unless context', function(done){
        var m = Latte.M(function(h){
                setTimeout(function(){
                    h('test');
                }, 0);
            }),
            ctx = {v : true},
            r;

        m.unless(function(v){
            return !this.v;
        }, ctx).always(function(v){
            r = v;
        });

        setTimeout(function(){
            assert.equal(r, 'test');
            done();
        }, 80);
    });

    it('pass', function(done){
        var st = fspy();

        Latte.M.Pack(11).pass().always(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.args[0], undefined);
            done();
        }, 10);
    });

    it('pass передача значения', function(done){
        var st = fspy();

        Latte.M.Pack(11).pass('value').always(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.args[0], 'value');
            done();
        }, 10);
    });

    it('pass от значения E', function(done){
        var st = fspy();

        Latte.M.Pack(Latte.E(11)).pass().always(st);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.args[0](), 11);
            done();
        }, 10);
    });

    it('raise', function(done){
        var st = fspy(),
            st2 = fspy();

        Latte.M.Pack(Latte.E('e')).raise(function(e){
            return 'new ' + e();
        }).fail(st).always(st2);

        setTimeout(function(){
            assert.equal(st.args[0](), 'new e');
            assert.equal(st2.args[0](), 'new e');
            done();
        }, 10);
    });

    it('raise не вызывается при отсутствии E значения', function(done){
        var st = fspy(),
            st2 = fspy();

        Latte.M.Pack('test').raise(st).always(st2);

        setTimeout(function(){
            assert.equal(st.called, false);
            assert.equal(st2.args[0], 'test');
            done();
        }, 10);
    });

    it('raise context', function(done){
        var m = Latte.M(function(h){
                setTimeout(function(){
                    h(Latte.E('test'));
                }, 0);
            }),
            ctx = {v : '-1'},
            r;

        m.raise(function(v){
            return v() + this.v;
        }, ctx).fail(function(v){
            r = v();
        });

        setTimeout(function(){
            assert.equal(r, 'test-1');
            done();
        }, 60);
    });

    it('wait', function(done){
        var st = fspy();

        Latte.M.Pack('test').wait(15).always(st);

        assert.equal(st.called, false);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.args[0], 'test');
            done();
        }, 100);
    });

    it('wait на выходе первый результат', function(done){
        var st = fspy(),
            m = Latte.M.Hand();

        m.inst.wait(15).always(st);
        m.hand('test');
        m.hand('rest');
        m.hand('west');


        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.args[0], 'test');
            done();
        }, 110);
    });

    it('static seq пустой массив', function(done){
        var st = fspy();
        Latte.M.seq([]).always(st);

        setTimeout(function(){
            assert.deepEqual(st.args[0], []);
            done();
        }, 10);
    });

    it('allseq', function(done){
        var st = fspy();
        Latte.M.allseq([Latte.M.Pack(1), Latte.M.Pack(2), Latte.M.Pack(3)]).always(st);

        setTimeout(function(){
            assert.deepEqual(st.args[0], [1,2,3]);
            done();
        }, 10);
    });

    it('allseq пустой массив', function(done){
        var st = fspy();
        Latte.M.allseq([]).always(st);

        setTimeout(function(){
            assert.deepEqual(st.args[0], []);
            done();
        }, 10);
    });

    it('allseq co значением E в массиве', function(done){
        var st = fspy();

        Latte.M.allseq([Latte.M.Pack(1), Latte.M.Pack(Latte.E('e')), Latte.M.Pack(3)]).always(st);

        setTimeout(function(){
            assert.equal(st.args[0].length, 3);

            assert.equal(st.args[0][0], 1);
            assert.equal(st.args[0][1](), 'e');
            assert.equal(st.args[0][2], 3);

            done();
        }, 10);
    });

    it('static lift', function(done){
        var st = fspy();

        Latte.M.lift(function(a){
            return a + '!!!';
        }, [Latte.M.Pack('test')]).always(st);

        setTimeout(function(){
            assert.equal(st.args[0], 'test!!!');
            done();
        }, 10);
    });

    it('static lift context', function(done){
        var st = fspy();

        Latte.M.lift(function(a){
            return a + this.a;
        }, [Latte.M.Pack('test')], {a : '!!!'}).always(st);

        setTimeout(function(){
            assert.equal(st.args[0], 'test!!!');
            done();
        }, 10);
    });

    it('static lift массив с несколькими элементами', function(done){
        var st = fspy();

        Latte.M.lift(function(a, b, c){
            return a + b + c;
        }, [Latte.M.Pack('test'), Latte.M.Pack(' '), Latte.M.Pack('Latte')]).always(st);

        setTimeout(function(){
            assert.equal(st.args[0], 'test Latte');
            done();
        }, 10);
    });

    it('static lift массив с несколькими элементами и значением E', function(done){
        var st = fspy();

        Latte.M.lift(function(a, b, c){
            return a + b + c;
        }, [Latte.M.Pack('test'), Latte.M.Pack(' '), Latte.M.Pack(Latte.E('e'))]).always(st);

        setTimeout(function(){
            assert.equal(st.args[0](), 'e');
            done();
        }, 10);
    });

    it('Gen sync only return', function(done){
        var spy = fspy();

        Latte.M.Gen(function*(){
            return 5;
        }).always(spy);

        setTimeout(function(){
            assert.equal(spy.args[0], 5);
            done();
        }, 10);
    });

    it('Gen sync only return & yield', function(done){
        var spy = fspy();

        Latte.M.Gen(function*(){
            var x = yield Latte.M.Pack(12),
                y = yield Latte.M.Pack(3);

            return (x / y + 5);
        }).always(spy);

        setTimeout(function(){
            assert.equal(spy.args[0], 9);
            done();
        }, 100);
    });

    it('Gen context', function(done){
        var spy = fspy();

        Latte.M.Gen(function*(){
            var x = yield Latte.M(function(h){
                    setTimeout(function(){
                        h(12);
                    }, 0);
                }),
                y = yield this.y;

            return (x / y + 5);
        }, {y : 3}).always(spy);

        setTimeout(function(){
            assert.equal(spy.args[0], 9);
            done();
        }, 100);
    });

    it('Gen async with handle', function(done){
        var spy = fspy();

        Latte.M.Gen(function*(h){
            var x = yield Latte.M(function(h){
                    setTimeout(function(){
                        h(12);
                    }, 0);
                }),
                y = yield 3;

            h('break');

            return (x / y + 5);
        }).always(spy);

        setTimeout(function(){
            assert.equal(spy.args[0], 'break');
            done();
        }, 111);
    });
});

describe('Latte Stream', function(){

    it('always', function(done){
        var st = fspy(),
            handle;

        Latte.S(function(h){
            handle = h;
            h(1);
        }).always(st);

        setTimeout(function(){
            handle(2);
            assert.equal(st.args[0], 2);

            setTimeout(function(){
                handle(24);
                assert.equal(st.args[0], 24);

                setTimeout(function(){
                    handle(Latte.E('e'));
                    assert.equal(st.args[0](), 'e');
                    assert.equal(st.count, 4);

                    done();
                }, 10);
            }, 10);
        }, 10);
    });

    it('Hand always', function(done){
        var st = fspy(),
            s = Latte.S.Hand();

        s.inst.always(st);

        s.hand(1);
        setTimeout(function(){
            assert.equal(st.args[0], 1);
            s.hand(2);

            setTimeout(function(){
                assert.equal(st.args[0], 2);
                s.hand(24);

                setTimeout(function(){
                    assert.equal(st.args[0], 24);
                    s.hand(Latte.E('e'));

                    setTimeout(function(){
                        assert.equal(st.args[0](), 'e');
                        assert.equal(st.count, 4);

                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('always от одного объекта', function(done){
        var st1 = fspy(),
            st2 = fspy(),
            st3 = fspy(),
            handle,
            s = Latte.S(function(h){
                handle = h;
            });

        s.always(st1);
        s.always(st2);
        s.always(st3);

        setTimeout(function(){
            handle(2);

            setTimeout(function(){
                assert.equal(st1.args[0], 2);
                assert.equal(st2.args[0], 2);
                assert.equal(st3.args[0], 2);

                handle(24);

                setTimeout(function(){
                    assert.equal(st1.args[0], 24);
                    assert.equal(st2.args[0], 24);
                    assert.equal(st3.args[0], 24);

                    handle(Latte.E('e'));

                    setTimeout(function(){
                        assert.equal(st1.args[0](), 'e');
                        assert.equal(st2.args[0](), 'e');
                        assert.equal(st3.args[0](), 'e');

                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('next', function(done){
        var st = fspy(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).next(st);

        setTimeout(function(){
            handle(2);

            setTimeout(function(){
                assert.equal(st.args[0], 2);
                handle(24);

                setTimeout(function(){
                    assert.equal(st.args[0], 24);
                    handle(Latte.E('e'));

                    setTimeout(function(){
                        assert.equal(st.count, 2);
                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('next от одного объекта', function(done){
        var st1 = fspy(),
            st2 = fspy(),
            st3 = fspy(),
            handle,
            s = Latte.S(function(h){
                handle = h;
            });

        s.next(st1);
        s.next(st2);
        s.next(st3);

        setTimeout(function(){
            handle(2);

            setTimeout(function(){
                assert.equal(st1.args[0], 2);
                assert.equal(st2.args[0], 2);
                assert.equal(st3.args[0], 2);

                handle(24);

                setTimeout(function(){
                    assert.equal(st1.args[0], 24);
                    assert.equal(st2.args[0], 24);
                    assert.equal(st3.args[0], 24);
                    handle(Latte.E('e'));

                    setTimeout(function(){
                        assert.equal(st1.count, 2);
                        assert.equal(st2.count, 2);
                        assert.equal(st3.count, 2);

                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('fail', function(done){
        var st = fspy(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).fail(st);

        assert.equal(st.called, false);

        setTimeout(function(){
            handle(2);
            assert.equal(st.called, false);

            setTimeout(function(){
                handle(24);
                assert.equal(st.called, false);

                setTimeout(function(){
                    handle(Latte.E('e'));

                    assert.equal(st.args[0](), 'e');
                    done();
                }, 10);
            }, 10);
        }, 10);
    });

    it('fail от одного объекта', function(done){
        var st1 = fspy(),
            st2 = fspy(),
            st3 = fspy(),
            handle,
            s = Latte.S(function(h){
                handle = h;
            });

        s.fail(st1);
        s.fail(st2);
        s.fail(st3);

        setTimeout(function(){
            handle(2);

            setTimeout(function(){
                assert.equal(st1.called, false);
                assert.equal(st1.called, false);
                assert.equal(st1.called, false);

                handle(24);

                setTimeout(function(){
                    assert.equal(st1.called, false);
                    assert.equal(st1.called, false);
                    assert.equal(st1.called, false);
                    handle(Latte.E('e'));

                    setTimeout(function(){
                        assert.equal(st1.args[0](), 'e');
                        assert.equal(st2.args[0](), 'e');
                        assert.equal(st3.args[0](), 'e');

                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('bnd', function(done){
        var st = fspy(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).bnd(function(v){
            return Latte.M.Pack(v + 5);
        }).always(st);

        setTimeout(function(){
            handle('t');

            setTimeout(function(){
                assert.equal(st.args[0], 't5');

                handle(Latte.E('e'));

                setTimeout(function(){
                    assert.equal(st.args[0](), 'e');
                    done();
                }, 10);
            }, 10);
        }, 10);
    });

    it('bnd генерирует значение E', function(done){
        var st = fspy(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).bnd(function(v){
            return Latte.M.Pack(Latte.E('e'));
        }).always(st);

        setTimeout(function(){
            handle('t');

            setTimeout(function(){
                assert.equal(st.args[0](), 'e');

                handle(Latte.E('e'));

                setTimeout(function(){
                    assert.equal(st.args[0](), 'e');
                    done();
                }, 10);
            }, 10);
        }, 10);
    });

    it('bnd вложенные вызовы', function(done){
        var st = fspy(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).bnd(function(v){
            return Latte.M.Pack(v).bnd(function(nv){
                return Latte.M.Pack('[' + nv + ']');
            });
        }).always(st);

        setTimeout(function(){
            handle('t');

            setTimeout(function(){
                assert.equal(st.args[0], '[t]');
                handle(Latte.E('e'));

                setTimeout(function(){
                    assert.equal(st.args[0](), 'e');
                    done();
                }, 20);
            }, 20);
        }, 20);
    });

    it('lift', function(done){
        var st = fspy(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).lift(function(v){
            return v + 5;
        }).lift(function(v){
            return '(' + v + ')';
        }).always(st);

        setTimeout(function(){
            handle(1);

            setTimeout(function(){
                assert.equal(st.args[0], '(6)');
                handle('t');

                setTimeout(function(){
                    assert.equal(st.args[0], '(t5)');
                    handle(Latte.E('e'));

                    setTimeout(function(){
                        assert.equal(st.args[0](), 'e');
                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('raise', function(done){
        var st = fspy(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).raise(function(e){
            return 'err: ' + e();
        }).always(st);

        setTimeout(function(){
            handle(1);

            setTimeout(function(){
                assert.equal(st.args[0], 1);
                handle('t');

                setTimeout(function(){
                    assert.equal(st.args[0], 't');
                    handle(Latte.E('e'));

                    setTimeout(function(){
                        assert.equal(st.args[0](), 'err: e');
                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('raise и fail по цепочке', function(done){
        var st = fspy(),
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

        setTimeout(function(){
            handle(1);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle('t');

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle(Latte.E('e'));

                    setTimeout(function(){
                        assert.equal(st.args[0](), 'err: e');
                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('wait', function(done){
        var st = fspy(),
            handle;

        Latte.S(function(h){
            handle = h;
        }).wait(15).always(st);

        assert.equal(st.called, false);


        setTimeout(function(){
            handle('test');

            setTimeout(function(){
                assert.equal(st.called, true);
                assert.equal(st.args[0], 'test');
                done();
            }, 20);
        }, 20);
    });

    it('wait на выходе последний результат', function(done){
        var st = fspy(),
            s = Latte.S.Hand();

        s.inst.wait(15).always(st);
        s.hand('test');
        s.hand('rest');
        s.hand('west');

        assert.equal(st.called, false);

        setTimeout(function(){
            assert.equal(st.called, true);
            assert.equal(st.args[0], 'west');
            done();
        }, 70);
    });

    it('static seq', function(done){
        var st = fspy(),
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

        setTimeout(function(){
            handle1(1);
            assert.equal(st.called, false);

            setTimeout(function(){
                handle2(2);
                assert.equal(st.called, false);

                setTimeout(function(){
                    handle3(3);
                    assert.deepEqual(st.args[0], [1,2,3]);
                    done();
                }, 10);
            }, 10);
        }, 10);
    });

    it('static seq и значение E', function(done){
        var st = fspy(),
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

        setTimeout(function(){
            handle1(2);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle2(Latte.E('err'));

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle3(1);

                    setTimeout(function(){
                        assert.equal(st.args[0](), 'err');
                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static allseq', function(done){
        var st = fspy(),
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

        setTimeout(function(){
            handle1(1);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle2(2);

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle3(3);

                    setTimeout(function(){
                        assert.deepEqual(st.args[0], [1,2,3]);
                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static allseq и значение E', function(done){
        var st = fspy(),
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

        setTimeout(function(){
            handle1(2);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle2(Latte.E('err'));

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle3(1);

                    setTimeout(function(){
                        assert.equal(st.args[0][0], 2);
                        assert.equal(st.args[0][1](), 'err');
                        assert.equal(st.args[0][2], 1);
                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static allseq только если все потоки с новыми данными', function(done){
        var st = fspy(),
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

        setTimeout(function(){
            handle1(1);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle2(2);

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle3(3);

                    setTimeout(function(){
                        assert.deepEqual(st.args[0], [1,2,3]);
                        st.reset();

                        handle1(1);
                        handle2(1);

                        setTimeout(function(){
                            assert.equal(st.called, false);
                            handle2(7);
                            handle3(3);

                            setTimeout(function(){
                                assert.deepEqual(st.args[0], [1,7,3]);
                                done();
                            }, 10);
                        }, 10);
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static lift', function(done){
        var st = fspy(),
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

        setTimeout(function(){
            handle1(1);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle2(2);

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle3(3);

                    setTimeout(function(){
                        assert.deepEqual(st.args[0], 6);
                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static lift и значение E', function(done){
        var st = fspy(),
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

        setTimeout(function(){
            handle1(2);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle2(Latte.E('err'));

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle3(1);

                    setTimeout(function(){
                        assert.equal(st.args[0](), 'err');
                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static bnd', function(done){
        var st = fspy(),
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

        Latte.S.bnd(function(a,b,c){
            return Latte.M.Pack(a + b + c);
        }, [s1,s2,s3]).always(st);

        setTimeout(function(){
            handle1(1);

            setTimeout(function(){
                assert.equal(st.called, false);

                handle2(2);

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle3(3);

                    setTimeout(function(){
                        assert.deepEqual(st.args[0], 6);
                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static bnd context', function(done){
        var st = fspy(),
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

        Latte.S.bnd(function(a,b,c){
            return Latte.M.Pack((a + b + c) + this.a);
        }, [s1,s2,s3], {a : '!!!'}).always(st);

        setTimeout(function(){
            handle1(1);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle2(2);

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle3(3);

                    setTimeout(function(){
                        assert.deepEqual(st.args[0], '6!!!');
                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static bnd и значение E', function(done){
        var st = fspy(),
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

        Latte.S.bnd(function(a, b, c){
            return Latte.M.Pack(a + b + c);
        }, [s1,s2,s3]).always(st);

        setTimeout(function(){
            handle1(2);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle2(Latte.E('err'));

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle3(1);

                    setTimeout(function(){
                        assert.equal(st.args[0](), 'err');
                        done();
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static any', function(done){
        var st = fspy(),
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

        setTimeout(function(){
            handle1('test');

            setTimeout(function(){
                assert.equal(st.args[0], 'test');
                handle2('test 2');

                setTimeout(function(){
                    assert.equal(st.args[0], 'test 2');
                    handle1('test 3');

                    setTimeout(function(){
                        assert.equal(st.args[0], 'test 3');
                        handle3('test 4');

                        setTimeout(function(){
                            assert.equal(st.args[0], 'test 4');
                            handle2(Latte.E('e'));

                            setTimeout(function(){
                                assert.equal(st.args[0](), 'e');
                                done();
                            }, 10);
                        }, 10);
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static pallseq', function(done){
        var st = fspy(),
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

        setTimeout(function(){
            handle1(11);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle3(3);

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle1(1);

                    setTimeout(function(){
                        assert.equal(st.called, false);
                        handle2(2);

                        setTimeout(function(){
                            assert.deepEqual(st.args[0], [1,2,3]);
                            st.reset();
                            handle1(11);

                            setTimeout(function(){
                                assert.deepEqual(st.args[0], [11,2,3]);
                                handle2(1);

                                setTimeout(function(){
                                    assert.deepEqual(st.args[0], [11,1,3]);
                                    handle2(7);

                                    setTimeout(function(){
                                        assert.deepEqual(st.args[0], [11,7,3]);
                                        handle3(9);

                                        setTimeout(function(){
                                            assert.deepEqual(st.args[0], [11,7,9]);
                                            handle1(1);

                                            setTimeout(function(){
                                                assert.deepEqual(st.args[0], [1,7,9]);
                                                done();
                                            }, 10);
                                        }, 10);
                                    }, 10);
                                }, 10);
                            }, 10);
                        }, 10);
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static pallseq и значение E', function(done){
        var st = fspy(),
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

        setTimeout(function(){
            handle1(1);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle2(2);

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle3(3);

                    setTimeout(function(){
                        assert.deepEqual(st.args[0], [1,2,3]);
                        st.reset();
                        handle1(11);

                        setTimeout(function(){
                            assert.deepEqual(st.args[0], [11,2,3]);
                            handle2(1);

                            setTimeout(function(){
                                assert.deepEqual(st.args[0], [11,1,3]);
                                handle2(7);

                                setTimeout(function(){
                                    assert.deepEqual(st.args[0], [11,7,3]);
                                    handle3(9);

                                    setTimeout(function(){
                                        assert.deepEqual(st.args[0], [11,7,9]);
                                        handle1(Latte.E('e'));

                                        setTimeout(function(){
                                            assert.deepEqual(st.args[0][0](), 'e');
                                            assert.deepEqual(st.args[0][1], 7);
                                            assert.deepEqual(st.args[0][2], 9);
                                            done();
                                        }, 10);
                                    }, 10);
                                }, 10);
                            }, 10);
                        }, 10);
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static pseq', function(done){
        var st = fspy(),
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

        setTimeout(function(){
            handle1(11);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle2(2);

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle1(1);

                    setTimeout(function(){
                        assert.equal(st.called, false);
                        handle3(3);

                        setTimeout(function(){
                            assert.deepEqual(st.args[0], [1,2,3]);
                            st.reset();
                            handle1(11);

                            setTimeout(function(){
                                assert.deepEqual(st.args[0], [11,2,3]);
                                handle2(1);

                                setTimeout(function(){
                                    assert.deepEqual(st.args[0], [11,1,3]);
                                    handle2(7);

                                    setTimeout(function(){
                                        assert.deepEqual(st.args[0], [11,7,3]);
                                        handle3(9);

                                        setTimeout(function(){
                                            assert.deepEqual(st.args[0], [11,7,9]);
                                            handle1(1);

                                            setTimeout(function(){
                                                assert.deepEqual(st.args[0], [1,7,9]);
                                                done();
                                            }, 10);
                                        }, 10);
                                    }, 10);
                                }, 10);
                            }, 10);
                        }, 10);
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static pseq и значение E', function(done){
        var st = fspy(),
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

        setTimeout(function(){
            handle1(1);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle2(2);

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle3(3);

                    setTimeout(function(){
                        assert.deepEqual(st.args[0], [1,2,3]);
                        st.reset();
                        handle1(11);

                        setTimeout(function(){
                            assert.deepEqual(st.args[0], [11,2,3]);
                            handle2(1);

                            setTimeout(function(){
                                assert.deepEqual(st.args[0], [11,1,3]);
                                handle2(7);

                                setTimeout(function(){
                                    assert.deepEqual(st.args[0], [11,7,3]);
                                    handle3(9);

                                    setTimeout(function(){
                                        assert.deepEqual(st.args[0], [11,7,9]);
                                        handle1(Latte.E('e'));

                                        setTimeout(function(){
                                            assert.deepEqual(st.args[0](), 'e');
                                            done();
                                        }, 10);
                                    }, 10);
                                }, 10);
                            }, 10);
                        }, 10);
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static plift', function(done){
        var st = fspy(),
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

        setTimeout(function(){
            handle1(1);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle2(2);

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle3(3);

                    setTimeout(function(){
                        assert.equal(st.args[0], 6);
                        handle2('+');

                        setTimeout(function(){
                            assert.equal(st.args[0], '1+3');
                            handle1('v');

                            setTimeout(function(){
                                assert.equal(st.args[0], 'v+3');
                                handle3('w');

                                setTimeout(function(){
                                    assert.equal(st.args[0], 'v+w');
                                    done();
                                }, 10);
                            }, 10);
                        }, 10);
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static plift и значение E', function(done){
        var st = fspy(),
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

        setTimeout(function(){
            handle1(1);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle2(2);

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle3(3);

                    setTimeout(function(){
                        assert.equal(st.args[0], 6);
                        handle2('+');

                        setTimeout(function(){
                            assert.equal(st.args[0], '1+3');
                            handle1('v');

                            setTimeout(function(){
                                assert.equal(st.args[0], 'v+3');
                                handle3('w');

                                setTimeout(function(){
                                    assert.equal(st.args[0], 'v+w');
                                    handle2(Latte.E('err'));

                                    setTimeout(function(){
                                        assert.equal(st.args[0](), 'err');
                                        handle3(1);

                                        setTimeout(function(){
                                            assert.equal(st.args[0](), 'err');
                                            done();
                                        }, 10);
                                    }, 10);
                                }, 10);
                            }, 10);
                        }, 10);
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static pbnd', function(done){
        var st = fspy(),
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

        Latte.S.pbnd(function(a,b,c){
            return Latte.M.Pack(a + b + c);
        }, [s1,s2,s3]).always(st);

        setTimeout(function(){
            handle1(1);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle2(2);

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle3(3);

                    setTimeout(function(){
                        assert.equal(st.args[0], 6);
                        handle2('+');

                        setTimeout(function(){
                            assert.equal(st.args[0], '1+3');
                            handle1('v');

                            setTimeout(function(){
                                assert.equal(st.args[0], 'v+3');
                                handle3('w');

                                setTimeout(function(){
                                    assert.equal(st.args[0], 'v+w');
                                    done();
                                }, 10);
                            }, 10);
                        }, 10);
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });

    it('static pbnd и значение E', function(done){
        var st = fspy(),
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

        Latte.S.pbnd(function(a, b, c){
            return Latte.M.Pack(a + b + c);
        }, [s1,s2,s3]).always(st);

        setTimeout(function(){
            handle1(1);

            setTimeout(function(){
                assert.equal(st.called, false);
                handle2(2);

                setTimeout(function(){
                    assert.equal(st.called, false);
                    handle3(3);

                    setTimeout(function(){
                        assert.equal(st.args[0], 6);
                        handle2('+');

                        setTimeout(function(){
                            assert.equal(st.args[0], '1+3');
                            handle1('v');

                            setTimeout(function(){
                                assert.equal(st.args[0], 'v+3');
                                handle3('w');

                                setTimeout(function(){
                                    assert.equal(st.args[0], 'v+w');

                                    setTimeout(function(){
                                        handle2(Latte.E('err'));
                                        assert.equal(st.args[0](), 'err');

                                        setTimeout(function(){
                                            handle3(1);
                                            assert.equal(st.args[0](), 'err');
                                            done();
                                        }, 10);
                                    }, 10);
                                }, 10);
                            }, 10);
                        }, 10);
                    }, 10);
                }, 10);
            }, 10);
        }, 10);
    });
});

describe('Latte common', function(){

    it('проверка M', function(){
        assert.equal(Latte.isM(), false);
        assert.equal(Latte.isM(''), false);
        assert.equal(Latte.isM(0), false);
        assert.equal(Latte.isM(/\*/), false);
        assert.equal(Latte.isM(NaN), false);
        assert.equal(Latte.isM(null), false);
        assert.equal(Latte.isM({}), false);
        assert.equal(Latte.isM(function(){}), false);

        assert.equal(Latte.isM(Latte.M.Pack(1)), true);
        assert.equal(Latte.isM(Latte.M.Pack(Latte.E('e'))), true);
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

   it('проверка S', function(){
        assert.equal(Latte.isS(), false);
        assert.equal(Latte.isS({}), false);
        assert.equal(Latte.isS(function(){}), false);
        assert.equal(Latte.isS(null), false);
        assert.equal(Latte.isS(undefined), false);

        assert.equal(Latte.isS(Latte.S(function(){})), true);

        assert.equal(Latte.isS(Latte.S.pseq([Latte.S(function(){})])), true);
        assert.equal(Latte.isS(Latte.S.plift(function(){}, [Latte.S(function(){})])), true);
   });

    it('E и M,S,SH', function(){
        assert.equal(Latte.E, Latte.M.E);
        assert.equal(Latte.E, Latte.S.E);
    });

    it('isE и M,S,SH', function(){
        assert.equal(Latte.isE, Latte.M.isE);
        assert.equal(Latte.isE, Latte.S.isE);
    });

    it('isL', function(){
        assert.equal(Latte.isL(Latte.E()), false);
        assert.equal(Latte.isL(Latte.M.Pack()), true);
        assert.equal(Latte.isL(Latte.M(function(){})), true);
        assert.equal(Latte.isL(Latte.S(function(){})), true);
    });
});

describe('Latte.compose', function(){

    it('empty list exception', function(){
        assert.throws(function(){
            Latte.compose([]);
        }, Error);
    });

    it('Latte.M success compose', function(done){
        var spy = fspy(),
            wfn = function(v){
                return Latte.M.Pack(v + 1);
            };

        Latte.compose([wfn, wfn, wfn], 5).always(spy);

        setTimeout(function(){
            assert.equal(spy.called, true);
            assert.equal(spy.args[0], 8);
            done();
        }, 40);
    });

    it('Latte.M error compose', function(done){
        var spy = fspy(),
            wfn = function(v){
                return Latte.M.Pack(Latte.E('error'));
            };

        Latte.compose([wfn, wfn, wfn], 5).always(spy);

        setTimeout(function(){
            assert.equal(spy.called, true);
            assert.equal(spy.args[0](), 'error');
            done();
        }, 10);
    });

    it('Latte.M not called next functions if error', function(done){
        var spy = fspy(),
            called = 0,
            wfn = function(v){
                called += 1;
                return Latte.M.Pack(Latte.E('error'));
            };

        Latte.compose([wfn, wfn, wfn], 5).always(spy);

        setTimeout(function(){
            assert.equal(spy.called, true);
            assert.equal(spy.args[0](), 'error');
            assert.equal(called, 1);
            done();
        }, 10);
    });

    it('Latte.M & Latte.S', function(done){
        var spy = fspy(),
            handle;

        Latte.compose([
            function(){
                var s = Latte.S.Hand();
                handle = s.hand;
                return s.inst;
            },
            function(v){
                return Latte.M.Pack('test-' + v);
            }
        ]).always(spy);

        setTimeout(function(){
            handle('1');

            setTimeout(function(){
                assert.equal(spy.args[0], 'test-1');
                handle('2');

                setTimeout(function(){
                    assert.equal(spy.args[0], 'test-2');
                    assert.equal(spy.count, 2);
                    done();
                }, 10);
            }, 10);
        }, 10);
    });
});

describe('Latte.extend', function(){

    it('c расширением', function(){
        var EM = Latte.extend(Latte.M, {test : function(){return 'test'}}),
            m1 = EM(function(h){
                h(5);
            }),
            m2 = EM.Pack(5);

        assert.equal(Latte.isM(m1), true);
        assert.equal(Latte.isM(m2), true);

        assert.equal(m1.test(), 'test');
        assert.equal(m2.test(), 'test');
    });

    it('без второго параметра', function(){
        var EM = Latte.extend(Latte.M),
            m1 = EM(function(h){
                h(5);
            }),
            m2 = EM.Pack(5);

        assert.equal(Latte.isM(m1), true);
        assert.equal(Latte.isM(m2), true);

        assert.equal(typeof m1.always, 'function');
        assert.equal(typeof m2.always, 'function');
    });

    it('с переопределением конструктора', function(){
        var st = fspy(),
            EM = Latte.extend(Latte.M, {
                constructor : function(){
                    st();
                    Latte.M.apply(this, arguments);
                }
            }),
            m1 = new EM(function(h){
                h(5);
            }),
            m2 = EM.Pack(5);

        assert.equal(Latte.isM(m1), true);
        assert.equal(Latte.isM(m2), true);
        assert.equal(typeof m1.always, 'function');
        assert.equal(typeof m2.always, 'function');
        assert.equal(st.called, true);
        assert.equal(st.count, 2);
    });
});

describe('Latte Stream & Latte Monad', function(){

    it('Монады и потоки в операциях со списками', function(done){
        var st = fspy(),
            handle1,
            handle2,
            sh = Latte.S(function(h){
                handle1 = h;
            }),
            s = Latte.S(function(h){
                handle2 = h;
            }),
            m = Latte.M.Pack(3);

        Latte.S.pseq([sh, s, m]).always(st);

        setTimeout(function(){
            handle1(1);
            handle2(2);

            assert.deepEqual(st.args[0], [1,2,3]);
            handle1(11);

            setTimeout(function(){
                assert.deepEqual(st.args[0], [11,2,3]);
                done();
            }, 10);
        }, 10);
    });
});
