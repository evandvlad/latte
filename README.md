Библиотека для работы с асинхронным/синхронным кодом на основе концепции монад и стрелок,
с соответствующими основными и вспомогательными методами/функциями.

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
    Latte.A(f).abnd(Latte) == f;

    // return <=< f == f
    Latte.A(Latte).abnd(f) == f;

    // (f <=< g) <=< h == f <=< (g <=< h)
    Latte.A(function(x){ return Latte.A(f).abnd(g)(x); }).abnd(h) ==
        Latte.A(f).abnd(function(x){ return Latte.A(g).abnd(h)(x); })

#### Создание монады ####
Монада создается с помощью одного из двух конструкторов: Latte или Latte.Later

С помощью конструктора Latte создается монада с заранее известным значением,
аналог функции return с типом (a -> m a)

    // a -> Latte a
    Latte('value');

С помощью конструктора Latte.Later создается монада, значение которой будет вычислено позднее.

    // ((a -> ()) -> ()) -> Latte a
    Latte.Later(function(handle){
        setTimeout(function(){
            handle('value');
        }, 2000);
    });

Для проверки, что значение является монадой, предоставлен метод - Latte.isLatte

    // a -> Bool
    Latte.isLatte('a') === false;
    Latte.isLatte(Latte('a')) === true;

#### Значение E ####
Значение E может трактоваться как пустое значение или ошибка
(конструктор Nothing для типа Maybe, конструктор Left типа Either).
Значение E создается с помощью конструктора Latte.E, с опциональным параметром. Чтобы получить переданное в конструктор значение,
возвращенное конструктором значение нужно вызвать как функцию.

    // a -> Latte.E a
    var errorVal = Latte.E('error');
    var nothingVal = Latte.E();

    errorVal() === 'error';
    nothingVal() === undefined;

Для проверки значения типа E, есть метод Latte.isE

    // a -> Bool
    Latte.isE(Error) === false;
    Latte.isE(Latte.E()) === true;

#### Методы для работы с одиночной монадой ####
Реализованы как методы с побочными эффектами, в данном случае подразумевается, что работа идет с одной и той же монадой
и ее значением, основная цель - побочный эффект, так и методы преобразующие одно значение в другое, -
возвращается другая монада с новым монадическим значением. Монадическое значение в любом случае является
неизменяемым.

Метод always принимает функцию, которой передается монадическое значение, независимо от того,
как закончился процесс вычисления этого значения (значение обычного типа или типа E).
Возвращаемое методом значение игнорируется.

    // Latte a -> (a -> ()) -> Latte a
    Latte('value').always(function(value){
        console.log(value);
    });

    Latte(Latte.E('error')).always(function(value){
        if(Latte.isE(value)){
            console.log('some error: ' + value());
        }
        else{
            console.log('ok, value: ' + value);
        }
    });

Метод next принимает функцию, которой передается монадическое значение успешного вычисления (не типа E).
Возвращаемое методом значение игнорируется.

    // Latte a -> (a -> ()) -> Latte a
    Latte('value').next(function(value){
        console.log(value);
    });

    Latte(Latte.E('error')).next(function(value){
        // функция не будет вызвана!
    });

Метод fail принимает функцию, которой передается монадическое значение типа E.
Возвращаемое методом значение игнорируется.

    // Latte a -> (a -> ()) -> Latte a
    Latte('value').fail(function(value){
        // функция не будет вызвана!
    });

    Latte(Latte.E('error')).fail(function(value){
        console.log('error: ' + value());
    });

Метод bnd используется для связания текущего успешного монадического значения с новым значением,
является аналогом функции >== с типом (m a -> (a -> m b) -> m b). Метод принимает функцию, примающую
текущее монадическое значение и возвращающую новую монаду. Если текущим монадическим значение является значение типа E,
то метод не вызывается и по цепочке будет передано это значение типа E.

    // Latte a -> (a -> Latte b) -> Latte b
    Latte('value').bnd(function(value){
        return Latte('new ' + value);
    });

    Latte(Latte.E('error')).bnd(function(){
        // функция не будет вызвана!
    });

Метод lift используется для поднятия нового значения в монаду. Метод может принимать как один, так и два параметра,
вариант с двумя параметрами будет рассмотрен позднее. В качестве первого параметра метод принимает функцию, которой
передается монадическое значение и возвращает новое значение, которое упаковывается в монаду. Если текущим монадическим
значение является значение типа E, то метод не вызывается и по цепочке будет передано это значение типа E.

    // Latte a -> (a -> b) -> Latte b
    Latte('value').lift(function(value){
        return 'new ' + value;
    });

    Latte(Latte.E('error')).lift(function(){
        // функция не будет вызвана!
    });

Метод raise используется для генерации нового значения типа E, он принимает функцию, принимающую значение типа E и
возвращащую значение, которое будет обернуто в тип E. Если текущим монадическим значение не является значение типа E,
то метод не вызывается.

    // Latte a -> (a -> b) -> Latte b
    Latte('value').raise(function(){
        // функция не будет вызвана!
    });

    Latte(Latte.E('error')).raise(function(e){
        return 'error: ' + e();
    });

#### Методы для работы со списком монад ####
Для работы со списком монад реализованы, как ряд методов объекта монады, так и статических методов Latte.
К методом объекта относятся два метода - lift и seq.

Как было рассмотрено ранее, метод lift поднимает новое значение в монаду. Он также может принимать опциональный второй
параметр - монаду или список монад. Из текущей монады и дополнительных собирается список и все монадические значения
передаются в переданную функцию, которая должна вернуть новое значение, из которого будет создана монада. Если одним из
значений будет тип E, то функция не будет вызвана.

    // Latte a -> (a -> b -> c) -> Latte b -> Latte c
    Latte(1).lift(function(a, b){
        return a + b;
    }, Latte(2));

    Latte(1).lift(function(a, b){
        // функция не будет вызвана!
    }, Latte(Latte.E('error')));


Если переданный массив пуст, то это аналогично вызову методу lift с одним параметром

    // Latte a -> (a -> a -> ... -> b) -> [Latte а] -> Latte b
    Latte(1).lift(function(a, b, c){
        return a + b + c;
    }, [Latte(2), Latte(3)]);

    Latte(1).lift(function(a, b){
        // функция не будет вызвана!
    }, [Latte(Latte.E('error')), Latte(3)]);

Метод seq принимает массив монад, к текущей монаде добавляется этот массив и все монадические значения собираются
в одну монаду - список всех монадических значений, если одним из значений будет тип E, то возвращается это монадическое
значение.

    // Latte a -> [Latte a] -> Latte [a]
    Latte(1).seq([Latte(2), Latte(3)]);

Статические методы Latte.lift и Latte.seq работают аналогичным, как и методы объекта образом.

    // (a -> b) -> Latte a -> Latte b
    Latte.lift(function(a){
        return a + 1;
    }, Latte(1));

    // (a -> a -> ... -> c) -> [Latte a] -> Latte с
    Latte.lift(function(a, b){
        return a + b;
    }, [Latte(1), Latte(2)]);

    // [Latte a] -> Latte [a]
    Latte.seq([Latte(1), Latte(2)]);

Метод allseq аналогичен методу seq, за исключением того, что он возвращает весь список значений, также и с типами E.

    // [Latte a] -> Latte [a]
    Latte.allseq([Latte(1), Latte(Latte.E('error'))]);

Метод fold производит свертку списка монад и возвращает монаду с одним значением. Метод принимает функцию свертки,
начальное значение и список монад. Если одним из значений будет тип E, то возвращается это монадическое значение.

    // (a -> b -> a) -> a -> [Latte b] -> Latte a
    Latte.fold(function(acc, v){
        return acc += v;
    }, 0, [Latte(1), Latte(2)]);

#### Arrow Latte.A ####
Помимо монады, также реализована простая стрелка, выполняющую обратную композию функций с помощью методов alift и abnd,
и работающая напрямую с монадами. Конструктор стрелки принимает функцию, которая принимает значение и возвращает монаду.

    // (a -> Latte b) -> Latte.A a Latte b
    Latte.A(function(value){
        return Latte(value);
    });

Чтобы передать значение на вычисление, стрелку необходимо вызвать как функцию, результатом работы будет монада.

    // Latte.A a Latte b -> a -> Latte b
    Latte.A(function(value){
        return Latte(value);
    })('value');

Метод alift принимает функцию, принимающую значение предыдущего вычисления и возвращающую новое значение,
которое будет помещено в монаду, метод возвращает новую стрелку. Если предыдущим значением было значение E,
то функция не будет вызвана.

    // Latte.A a Latte b -> (b -> c) -> Latte.A b Latte c
    Latte.A(Latte).alift(function(a){
        return a + 1;
    });

Метод abnd принимает функцию, принимающую значение предыдущего вычисления и возвращающую новое монадическое значение,
метод возвращает новую стрелку. Если предыдущим значением было значение E, то функция не будет вызвана.

    // Latte.A a Latte b -> (b -> Latte c) -> Latte.A b Latte c
    Latte.A(Latte).abnd(function(a){
        return Latte(a + 1);
    });
