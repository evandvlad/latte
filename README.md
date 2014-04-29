Библиотека для работы с асинхронным/синхронным кодом на основе концепции монад (обещания), потоков (frp).

### Значение E ###

---

Значение E может трактоваться как пустое значение (Empty), ошибка (Error), неподходящее значение. Создается с помощью конструктора Latte.E,
с опциональным параметром. Конструктор возвращает функцию, при вызове которой возвращается переданное в конструктор значение.

    // E = (a -> a)

    // a -> E a
    var errorVal = Latte.E('error');
    var nothingVal = Latte.E();

    errorVal() === 'error';
    nothingVal() === undefined;

Для проверки что значения является типом E, есть метод Latte.isE

    // a -> Bool
    Latte.isE(Error) === false;
    Latte.isE(Latte.E()) === true;

### Монада. Latte.M, Latte.Mv и Latte.Mh ###

---

Монада создается с помощью конструкторов: Latte.M, Latte.Mv или Latte.Mh.

С помощью конструктора Latte.Mv создается монада с заранее известным значением
(аналог функции return класса Monad с типом: a -> m a).

    // a -> Latte.M a
    Latte.Mv('value');

С помощью конструктора Latte.M создается монада, значение которой будет вычислено позднее.

    // ((a -> ()) -> ()) -> Latte.M a
    Latte.M(function(handle){
        setTimeout(function(){
            handle('value');
        }, 2000);
    });

С помощью Latte.Mh (h - hand) создается объект состоящий из экземпляра монады и метода передающего значения в монаду - hand.

    // () -> { hand :: (a -> ()), inst :: Latte.M a }
    var mh = Latte.Mh();

    mh.inst.always(function(value){
        console.log(value);
    });

    mh.hand('value');

Для проверки, что значение является монадой, предоставлен метод - Latte.isM

    // a -> Bool
    Latte.isM('a') === false;
    Latte.isM(Latte.Mv('a')) === true;

#### Методы монады ####

Определены как методы объекта монады, так и статические методы (вызовы от объекта Latte.M).

#### Методы объекта ####

##### always #####
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

##### next #####
Метод принимает функцию, которой передается монадическое значение только успешного вычисления (не типа E).
Возвращаемое методом значение игнорируется.

    // Latte.M a -> (a -> ()) -> Latte.M a
    Latte.Mv('value').next(function(value){
        console.log(value);
    });

    Latte.Mv(Latte.E('error')).next(function(value){
        // функция не будет вызвана!
    });

##### fail #####
Метод принимает функцию, которой передается монадическое значение только неуспешного вычисления (типа E).
Возвращаемое методом значение игнорируется.

    // Latte.M E a -> (E a -> ()) -> Latte.M E a
    Latte.Mv('value').fail(function(value){
        // функция не будет вызвана!
    });

    Latte.Mv(Latte.E('error')).fail(function(value){
        console.log('error: ' + value());
    });

##### bnd #####
Метод используется для связания текущего успешного монадического значения с новым значением
(является аналогом функции >== класса Monad с типом: (a -> m b) -> m a -> m b). Метод принимает функцию, принимающую
текущее успешное монадическое значение и возвращающую новую монаду.

    // Latte.M a -> (a -> Latte.M b) -> Latte.M b
    Latte.Mv('value').bnd(function(value){
        return Latte.Mv('new ' + value);
    });

    Latte.Mv(Latte.E('error')).bnd(function(){
        // функция не будет вызвана!
    });

##### lift #####
Метод используется для поднятия нового значения в монаду. Метод принимает функцию, которой
передается успешное монадическое значение и возвращает новое значение, которое упаковывается в монаду
(является аналогом функции fmap класса Functor с типом: (a -> b) -> f a -> f b).

    // Latte.M a -> (a -> b) -> Latte.M b
    Latte.Mv('value').lift(function(value){
        return 'new ' + value;
    });

    Latte.Mv(Latte.E('error')).lift(function(){
        // функция не будет вызвана!
    });

##### raise #####
Метод используется для генерации нового значения типа E, он принимает функцию, принимающую значение типа E и
возвращащую значение, которое будет обернуто в тип E.

    // Latte.M E a -> (E a -> b) -> Latte.M E b
    Latte.Mv('value').raise(function(){
        // функция не будет вызвана!
    });

    Latte.Mv(Latte.E('error')).raise(function(e){
        return 'error: ' + e();
    });

##### when #####
Метод фильтрации, последующая цепочка вызовов будет прервана в случае, если значение не удовлетворяет предикату.

    // Latte.M a -> (a -> Bool) -> Latte.M a
    Latte.Mv(5).when(function(v){
        return v > 5;
    });

    Latte.Mv(5).when(function(x){
        return x > 10;
    }).always(function(x){
        // не будет вызвана
    });

##### unless #####
Метод фильтрации, последующая цепочка вызовов будет прервана в случае, если значение удовлетворяет предикату.

    // Latte.M a -> (a -> Bool) -> Latte.M a
    Latte.Mv(5).unless(function(v){
        return v > 5;
    });

    Latte.Mv(5).unless(function(x){
        return x < 10;
    }).always(function(x){
        // не будет вызвана
    });

##### pass #####
Метод отбрасывающий результат предыдущего успешного вычисления и принимающий значение, которое будет новым монадическим значением.

    // Latte.M a -> b -> Latte.M b
    Latte.Mv(5).pass('value').next(function(v){
        // v - value
    });

#### Методы Latte.M ####

##### E #####
Конструктор значения E для монады (соответствует конструктору Latte.E). Может потребоваться для расширения существующих
сущностей.

    Latte.M.E === Latte.E // true

##### isE #####
Функция проверки на значение ее (соответствует функции Latte.isE). Может потребоваться для расширения существующих
сущностей.

    Latte.M.isE === Latte.isE // true

##### seq #####
Метод получает массив монад и возвращает монаду содержащую список значений, либо, если одно из вычислений имеет значение E,
то первое значение E в массиве.

    // [Latte.M a] -> Latte.M [a]
    Latte.M.seq([Latte.Mv(1), Latte.Mv(2)]);

##### allseq #####
Метод аналогичен методу seq, за исключением того, что он возвращает весь список значений, также и с типами E.

    // [Latte.M a] -> Latte.M [a]
    Latte.M.allseq([Latte.Mv(1), Latte.Mv(Latte.E('error'))]);

##### fold #####
Метод производит свертку списка монад и возвращает монаду с одним значением. Метод принимает функцию свертки,
начальное значение и список монад. Если одним из значений будет тип E, то возвращается это монадическое значение.

    // (a -> b -> a) -> a -> [Latte.M b] -> Latte.M a
    Latte.M.fold(function(acc, v){
        return acc += v;
    }, 0, [Latte.Mv(1), Latte.Mv(2)]);

##### lift #####
Метод принимает функцию преобразования и список монад, все монадические значения передаются в
качестве аргументов в функцию преобразования. Функция преобразования возвращает значение, которое будет преобразовано
в монаду (аналог функции fmap с типом: ). Если одним из значений будет тип E, то функция не будет вызвана.

    // (a -> a -> ... -> b) -> [Latte.M a] -> Latte.M b
    Latte.M.lift(function(a, b){
        return a + b;
    }, [Latte.Mv(1), Latte.Mv(2)]);

#### Monad laws ####

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


### Поток. Latte.S, Latte.SH, Latte.Sh и Latte.SHh ###

---

Потоки используются для повторяющихся событий, хранения состояния, реализуют интерфейс монад.

    // ((a -> ()) -> ()) -> Latte.S Latte.M a
    Latte.S(function(h){
        document.addEventListener('click', h, false);
    }).always(function(e){
        console.log(e);
    });

Отличие потока Latte.SH в том, что он удерживает текущее состояние (SH - stream hold) и в этом смысле аналогичен монаде M,
только в отличие от нее, может изменять это состояние.

    Latte.S(function(h){
        h('value');
    }).always(function(v){
        // метод не будет вызван, поскольку вызов конструктора произошел ранее добавления метода
    });

    Latte.SH(function(h){
        h('value');
    }).always(function(v){
        // метод будет вызван, поскольку текущее значение удерживается, v = value
    });

Latte.Sh и Latte.SHh аналогичны методу Latte.Mh, определенные для потоков.

Для проверки, что значение является потоком, предоставлен метод - Latte.isS

    // a -> Bool
    Latte.isS('a') === false;
    Latte.isS(Latte.S(function(){})) === true;

#### Методы потока ####

Определены как методы объекта потока, так и статические методы. Префикс p (partial) - первая буква в названии метода, определяет поведение метода,
при котором изменение в одном из потоков будет инициировать дальнейшее распространение потока события, для потоков же, данные которых не изменились,
передаются текущие значения. Метод any также определен для группы потоков и инициирует дальнейшее распространение потока
в случае изменения одного из потоков в группе, передается значение этого изменененного потока. Остальные методы работают
аналогичным образом как и для монад.

#### Методы объекта ####

always, next, fail, bnd, lift, raise, when, unless, pass.

#### Методы Latte.S и Latte.SH ####

E, isE, seq, pseq, any, lift, plift, fold, pfold, allseq, pallseq.

### Комбинирование монад и потоков ###

---

Комбинация разных типов потоков и монад в операциях со списком:

    var s = Latte.S(function(handle){
        var x = 0;
        setInterval(function(){
            handle(++x);
        }, 5000);
    });

    var sh = Latte.SH(function(handle){
        var x = 0;

        setInterval(function(){
            handle(++x);
        }, 5000);

        handle(x);
    });

    var m = Latte.Mv(0);

    Latte.S.pseq([s, sh, m]).always(function(v){
        console.log(v);
    });
