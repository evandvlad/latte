Монада для работы с асинхронным кодом/"обещаниями"

### Monad laws ######

    var x = 'test';

    function f(v){
        return Latte('[' + v + ']');
    }

    function g(v){
        return Latte('<' + v + '>');
    }

    function h(v){
        return Latte('{' + v + '}');
    }


    // Left identity: (return x) >>= f == f x
    Latte(x).bnd(f) == f(x);

    // Right identity: m >>= return == m
    Latte(x).bnd(Latte) == Latte(x);

    // Associativity: (m >>= f) >>= g == m >>= (\x -> f x >>= g)
    Latte(x).bnd(f).bnd(g) == Latte(x).bnd(function(x){ return f(x).bnd(g); });


    // Alternative
    // f <=< return == f
    Latte.arw(f, Latte)(x) == f(x);

    // return <=< f == f
    Latte.arw(Latte, f)(x) == f(x);

    // (f <=< g) <=< h == f <=< (g <=< h)
    Latte.arw(function(x){ return Latte.arw(f, g)(x); }, h)(x) ==
        Latte.arw(f, function(x){ return Latte.arw(g, h)(x); })(x)
