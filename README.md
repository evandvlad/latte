Библиотека для работы с асинхронным/синхронным кодом на основе концепции монад и стрелок.

### Значение E ###

Значение E может трактоваться как пустое значение (Empty) или ошибка (Error), создается с помощью конструктора Latte.E,
с опциональным параметром. Кунструктор возвращает функцию, при вызове которой возвращается переданное в конструктор значение.

    // a -> E a
    var errorVal = Latte.E('error');
    var nothingVal = Latte.E();

    errorVal() === 'error';
    nothingVal() === undefined;

Для проверки что значения является типом E, есть метод Latte.isE

    // a -> Bool
    Latte.isE(Error) === false;
    Latte.isE(Latte.E()) === true;

### Монада ###

Монада создается с помощью одного из двух конструкторов: Latte.M или Latte.Mv

С помощью конструктора Latte.Mv создается монада с заранее известным значением,
аналог функции return с типом (a -> m a)

    // a -> Latte.M a
    Latte.Mv('value');

С помощью конструктора Latte.M создается монада, значение которой будет вычислено позднее.

    // ((a -> ()) -> ()) -> Latte.M a
    Latte.M(function(handle){
        setTimeout(function(){
            handle('value');
        }, 2000);
    });

Для проверки, что значение является монадой, предоставлен метод - Latte.isM

    // a -> Bool
    Latte.isM('a') === false;
    Latte.isM(Latte.Mv('a')) === true;

### Методы монады ###

Определены как методы объекта монады, так и статические методы (вызовы от объекта Latte.M).

### Методы объекта ###

#### always ####
Метод принимает функцию, которой передается монадическое значение, независимо от того,
как закончился процесс вычисления этого значения (значение обычного типа или типа E).
Возвращаемое методом значение игнорируется.

    // Latte.M a -> (a -> ()) -> Latte.M a
    Latte.Mv('value').always(function(value){
        console.log(value);
    });

    Latte.Mv(Latte.E('error')).always(function(value){
        if(Latte.isE(value)){
            console.log('some error: ' + value());
        }
        else{
            console.log('ok, value: ' + value);
        }
    });

#### next ####
Метод принимает функцию, которой передается монадическое значение только успешного вычисления (не типа E).
Возвращаемое методом значение игнорируется.

    // Latte.M a -> (a -> ()) -> Latte.M a
    Latte.Mv('value').next(function(value){
        console.log(value);
    });

    Latte.Mv(Latte.E('error')).next(function(value){
        // функция не будет вызвана!
    });

#### fail ####
Метод принимает функцию, которой передается монадическое значение только неуспешного вычисления (типа E).
Возвращаемое методом значение игнорируется.

    // Latte.M a -> (a -> ()) -> Latte.M a
    Latte.Mv('value').fail(function(value){
        // функция не будет вызвана!
    });

    Latte.Mv(Latte.E('error')).fail(function(value){
        console.log('error: ' + value());
    });

#### bnd ####
Метод используется для связания текущего успешного монадического значения с новым значением,
является аналогом функции >== с типом (m a -> (a -> m b) -> m b). Метод принимает функцию, принимающую
текущее успешное монадическое значение и возвращающую новую монаду.

    // Latte.M a -> (a -> Latte.M b) -> Latte.M b
    Latte.Mv('value').bnd(function(value){
        return Latte.Mv('new ' + value);
    });

    Latte.Mv(Latte.E('error')).bnd(function(){
        // функция не будет вызвана!
    });

#### lift ####
Метод используется для поднятия нового значения в монаду. Метод принимает функцию, которой
передается успешное монадическое значение и возвращает новое значение, которое упаковывается в монаду.

    // Latte.M a -> (a -> b) -> Latte.M b
    Latte.Mv('value').lift(function(value){
        return 'new ' + value;
    });

    Latte.Mv(Latte.E('error')).lift(function(){
        // функция не будет вызвана!
    });

#### raise ####
Метод используется для генерации нового значения типа E, он принимает функцию, принимающую значение типа E и
возвращащую значение, которое будет обернуто в тип E.

    // Latte.M a -> (a -> b) -> Latte.M b
    Latte.Mv('value').raise(function(){
        // функция не будет вызвана!
    });

    Latte.Mv(Latte.E('error')).raise(function(e){
        return 'error: ' + e();
    });

#### seq ####
Метод используется для объединения текущего успешного монадического значения с другими монадическими значения,
(текущее значение добавляется в начало массива) он принимает массив монад и возвращает новую монаду,
в качестве значения которой будет либо массив всех монадических значений, либо значение типа E,
если хотя бы одно из значений в монадах было типа E.

    // Latte.M a -> [Latte.M a] -> Latte.M [a]
    Latte.Mv('value').seq([Latte.Mv('other value')]);

### Методы Latte.M ###

#### seq ####
Метод работает аналогичным, как и метод объекта образом.

    // [Latte.M a] -> Latte.M [a]
    Latte.M.seq([Latte.Mv(1), Latte.Mv(2)]);

#### allseq ####
Метод аналогичен методу seq, за исключением того, что он возвращает весь список значений, также и с типами E.

    // [Latte.M a] -> Latte.M [a]
    Latte.M.allseq([Latte.Mv(1), Latte.Mv(Latte.E('error'))]);

#### fold ####
Метод производит свертку списка монад и возвращает монаду с одним значением. Метод принимает функцию свертки,
начальное значение и список монад. Если одним из значений будет тип E, то возвращается это монадическое значение.

    // (a -> b -> a) -> a -> [Latte.M b] -> Latte.M a
    Latte.M.fold(function(acc, v){
        return acc += v;
    }, 0, [Latte.Mv(1), Latte.Mv(2)]);

#### lift ####
Метод принимает функцию преобразования и список монад, все монадические значения передаются в
качестве аргументов в функцию преобразования. Функция преобразования возвращает значение, которое будет преобразовано
в монаду. Если одним из значений будет тип E, то функция не будет вызвана.

    // (a -> a -> ... -> c) -> [Latte.M a] -> Latte.M с
    Latte.M.lift(function(a, b){
        return a + b;
    }, [Latte.Mv(1), Latte.Mv(2)]);

### Monad laws ###

    var x = 'test';

    function f(v){
        return Latte.Mv('[' + v + ']');
    }

    function g(v){
        return Latte.Mv('<' + v + '>');
    }

    function h(v){
        return Latte.Mv('{' + v + '}');
    }


    // Left identity: (return x) >>= f == f x
    Latte.Mv(x).bnd(f) == f(x);

    // Right identity: m >>= return == m
    Latte.Mv(x).bnd(Latte.M) == Latte.Mv(x);

    // Associativity: (m >>= f) >>= g == m >>= (\x -> f x >>= g)
    Latte.Mv(x).bnd(f).bnd(g) == Latte.Mv(x).bnd(function(x){ return f(x).bnd(g); });


### Стрелка ###

Стрелка работает напрямую с монадами Latte.M и реализуют аналогичный интерфейс. Реализована только
стрелка обратной композиции функции, она только идеалогически соответствует типу Arrow определенному в Haskell.
Задачи стрелки - осуществить необходимую композицию переданных функций, вызов с определенным значением и
получения результата. Для передачи значения ("вызова"), стрелку необходимо вызвать как функцию, она принимает один
аргумент и в качестве возвращаемого значения получает монаду. Создается стрелка с помощью конструктора Latte.A, которому
передается функция, принимаюшая значение и возвращающая монаду.

    // (a -> Latte.M b) -> Latte.A a Latte.M b
    Latte.A(function(value){
        return Latte.Mv(value);
    });

Вычисление:

    // Latte.A a Latte.M b -> a -> Latte.M b
    Latte.A(function(value){
        return Latte.Mv(value);
    })('value');

Для проверки, что значение является стрелкой, предоставлен метод - Latte.isA

    // a -> Bool
    Latte.isA('a') === false;
    Latte.isA(Latte.A(Latte.Mv)) === true;

### Методы стрелки ###

Определены как методы объекта стрелки, так и статические методы (вызовы от объекта Latte.A);
Latte.A яляется пространством имен стрелки.

### Методы объекта ###

#### always ####
Метод принимает функцию, которой передается значение, независимо от того,
как закончился процесс вычисления этого значения (значение обычного типа или типа E).
Возвращаемое методом значение игнорируется.

    // Latte.A a Latte.M b -> (b -> ()) -> Latte.A a Latte.M b
    Latte.A(Latte.Mv).always(function(value){
        console.log(value);
    });

#### next ####
Метод принимает функцию, которой передается значение только успешного вычисления (не типа E).
Возвращаемое методом значение игнорируется.

    // Latte.A a Latte.M b -> (b -> ()) -> Latte.A a Latte.M b
    Latte.A(Latte.Mv).next(function(value){
        console.log(value);
    });

#### fail ####
Метод принимает функцию, которой передается значение только неуспешного вычисления (типа E).
Возвращаемое методом значение игнорируется.

    // Latte.A a Latte.M b -> (b -> ()) -> Latte.A a Latte.M b
    Latte.Mv('value').fail(function(value){
        // функция не будет вызвана!
    });

    Latte.Mv(Latte.E('error')).fail(function(value){
        console.log('error: ' + value());
    });

#### bnd ####
Метод принимает функцию, принимающую значение предыдущего вычисления и возвращающую новое монадическое значение.

    // Latte.A a Latte.M b -> (b -> Latte.M c) -> Latte.A b Latte.M c
    Latte.A(Latte.Mv).bnd(function(a){
        return Latte.Mv(a + 1);
    });

#### lift ####
Метод принимает функцию, принимающую значение предыдущего вычисления и возвращающую новое значение,
которое будет помещено в монаду.

    // Latte.A a Latte.M b -> (b -> c) -> Latte.A b Latte.M c
    Latte.A(Latte.Mv).lift(function(a){
        return a + 1;
    });

#### raise ####
Метод используется для генерации нового значения типа E, он принимает функцию, принимающую значение типа E и
возвращащую значение, которое будет обернуто в тип E.

    // Latte.A a Latte.M b -> (b -> c) -> Latte.A b Latte.M c
    Latte.A(Latte.Mv).raise(function(){
        // функция не будет вызвана!
    });

#### seq ####
Метод используется для объединения стрелок.

    // Latte.A a Latte.M b -> [Latte.A a Latte.M b] -> Latte.A a [Latte.M b]
    Latte.A(Latte.Mv).seq([Latte.A(Latte.Mv)]);

#### ladd ####
Метод принимает другую стрелку и добавляет ее перед текущей в вычислениях.

    // Latte.A a Latte.M b -> Latte.A d Latte.M a -> Latte.A b Latte.M c
    Latte.A(Latte.Mv).ladd(Latte.A(function(v){
        return Latte.Mv('add before ' + v);
    }));

#### radd ####
Метод принимает другую стрелку и добавляет ее после текущей в вычислениях.

    // Latte.A a Latte.M b -> Latte.A b Latte.M c -> Latte.A c Latte.M d
    Latte.A(Latte.Mv).radd(Latte.A(function(v){
        return Latte.Mv('add after ' + v);
    }));


### Методы Latte.A ###

Определены методы: Latte.A.seq, Latte.A.allseq, Latte.A.fold, Latte.A.lift, они работают с группой стрелок,
аналогичный образом, как те же методы для работы с монадами.