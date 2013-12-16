working with promise as monad

### Monad laws ######

    function f(a){
        return latte.unit(a + 1);
    }

    function g(a){
        return latte.unit(a + 2);
    }


    // Left identity: return a >>= f ≡ f a
    latte.unit(2)(f) ≡ f(2);

    // Right identity: m >>= return ≡ m
    latte.unit(2)(latte.unit) ≡ latte.unit(2);

    // Associativity: (m >>= f) >>= g ≡ m >>= (\x -> f x >>= g)
    latte.unit(2)(f)(g) ≡ latte.unit(2)(function(a){
        return f(a)(g);
    });