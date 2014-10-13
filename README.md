Библиотека для работы с асинхронным кодом с помощью обещаний (promise) и потоков (stream).

Потоки (Stream) и обещания (Promise) имеют один интерфейс и отличаются тем, что потоки могут изменять внутреннее состояние, 
в то время как обещания - нет, значение может быть задано, но после его задания оно не может быть изменено.

### Создание Promise/Stream ###

Конструкторы примают два параметра - функцию инициализации и опционально, контекст для нее. Функция инициализации принимает в 
качестве параметра функцию изменения внутреннего состояния (для передачи данных в обещание/поток). Возвращаемое значение из функции инициализации 
игнорируется. Функция вызывается сразу же при создании обещания/потока.

    new Latte.Promise(function(handle){
        setTimeout(function(){
            handle(Date.now());
        }, 1000);
    });
    
Конструкторы могут быть вызваны как с ключевым словом new, так и без него.

    Latte.Stream(function(handle){
        setInterval(function(){
            handle(this.caption + Date.now());
        }.bind(this), 1000);
    }, {
        caption : 'Timestamp: '
    });
    
Есть возможность создавать потоки и обещания еще двумя отличными способами (с помощью es6 генераторов и с помощью Shell объектов), 
они будут рассмотрены далее.

### Методы проверки Promise/Stream ###

Latte.isLatte - метод проверяющий что аргумент является экземпляром Promise или Stream.

    Latte.isLatte(Latte.Promise(function(){})) === true;
    Latte.isLatte({}) === false;
    
Latte.isPromise - метод проверяющий что аргумент является экземпляром Promise.

    Latte.isPromise(Latte.Promise(function(){})) === true;
    Latte.isPromise(Latte.Stream(function(){})) === false;
    
Latte.isStream - метод проверяющий что аргумент является экземпляром Stream.

    Latte.isStream(Latte.Stream(function(){})) === true;
    Latte.isStream(Latte.Promise(function(){})) === false;
    
Указанные методы также работают и для расширенных экземпляров Promise/Stream (расширенных с помощью Latte.extend).

### Latte.E ###

Значение E может трактоваться как ошибка, пустое или отброшенное значение, с его помощью реализуется ветвление, 
различающее успешное и неуспешное выполнение. Конструктор принимает один параметр и возвращает объект E с полем value, 
хранящее переданные данные.

    var error = Latte.E('error');
    var empty = Latte.E();
    
    error.value === 'error'; // true
    empty.value === undefined; // true
    
Для проверки на значение E есть метод Latte.isE

    Latte.isE(Latte.E()) === true;
    Latte.isE({value : ''}) === false; 
    
### Nothing ###

Значение Nothing - отсутствие значения, данное значение используется если значение не было задано. 
Для проверки на значение Nothing есть метод Latte.isNothing.
 
### Методы объекта Promise/Stream ###

Как было сказано ранее, Promise и Stream реализуют один интерфейс. 

Методы: always, next, fail, when, unless, lift, elift, bnd, ebnd - принимают в качестве параметров, функцию обработки и контекст для нее 
(опционально). Функция принимает два параметра - текущее значение и предыдущее значение или значение Nothing 
(для обещаний предыдущее значение должно быть Nothing, поскольку при задании значения оно не изменяется). 
Предыдущее значение определяется обработчиком, то есть передаются те значения, которые обрабатываеются функцией.

Методы: allseq, seq, any - принимают в качестве параметра единичный экземпляр (Promise/Stream) или массив экземпляров.

Методы: always, next, fail - возвращают текущий экземпляр (используются ради побочных эффектов, 
возвращаемый результат из функции обработки игнорируется), в то время как остальные методы создают новые экземпляры.

##### always #####

Метод предназначен для побочных эффектов и вызывает переданную в него функцию независимо от того успешное значение или нет (значение E). 
Возвращаемое значение из переданной в него функции игнорируется.

    Latte.Promise(function(handle){
        setTimeout(function(){
            handle('test');
        }, 1000);
    }).always(function(value, prev){
        value === 'test'; // true
        Latte.isNothing(prev); // true
    });
    
    Latte.Promise(function(handle){
        setTimeout(function(){
            handle(Latte.E(this.message));
        }.bind(this), 1000);
    }, {message : 'error'}).always(function(value, prev){
        Latte.isE(value); // true
        value.value === 'error'; // true
        Latte.isNothing(prev); // true
    });
    
##### next #####

Метод предназначен для побочных эффектов и вызывает переданную в него функцию при успешном значении. 
Возвращаемое значение из переданной в него функции игнорируется.

    Latte.Promise(function(handle){
        setTimeout(function(){
            handle('test');
        }, 1000);
    }).next(function(value, prev){
        value === 'test'; // true
        Latte.isNothing(prev); // true
    });
    
    Latte.Promise(function(handle){
        setTimeout(function(){
            handle(Latte.E(this.message));
        }.bind(this), 1000);
    }, {message : 'error'}).next(function(value, prev){
        // функция не будет вызвана
    });

##### fail #####

Метод предназначен для побочных эффектов вызывает переданную в него функцию при значении E. 
Возвращаемое значение из переданной в него функции игнорируется.

    Latte.Promise(function(handle){
        setTimeout(function(){
            handle('test');
        }, 1000);
    }).fail(function(value, prev){
        // функция не будет вызвана
    });
    
    Latte.Promise(function(handle){
        setTimeout(function(){
            handle(Latte.E(this.message));
        }.bind(this), 1000);
    }, {message : 'error'}).fail(function(value, prev){
        Latte.isE(value); // true
        value.value === 'error'; // true
        Latte.isNothing(prev); // true
    });
    
##### when #####

Управляющий метод, переданная в него функция определяет продолжать ли далее передавать значение по цепочке или нет, возвращаемое значение 
функции приводится к типу Boolean. Обрабатываются только успешные значения (не типа E).

    Latte.Promise(function(handle){
        setTimeout(function(){
            handle('test');
        }, 1000);
    }).when(function(value, prev){
        return value !== prev;
    }).next(function(value){
        value === 'test'; // true
    });
    
##### unless #####

Управляющий метод, переданная в него функция определяет прекратить ли передачу по цепочке или продолжить, возвращаемое значение 
функции приводится к типу Boolean. Обрабатываются только успешные значения (не типа E).

    Latte.Promise(function(handle){
        setTimeout(function(){
            handle('test');
        }, 1000);
    }).unless(function(value, prev){
        return value === prev;
    }).next(function(value){
        value === 'test'; // true
    });
    
##### lift #####

Метод преобразования успешного значения. При необходимости можно вернуть E значение.

    Latte.Promise(function(handle){
        setTimeout(function(){
            handle('test');
        }, 1000);
    }).lift(function(value, prev){
        return value + '-1';
    }).next(function(value){
        value === 'test-1'; // true
    });
    
    Latte.Promise(function(handle){
        setTimeout(function(){
            handle('test');
        }, 1000);
    }).lift(function(value, prev){
        return Latte.E('error');
    }).next(function(value){
        // функция не будет вызвана
    }).fail(function(e){
        e.value === 'error' // true;
    });
    
##### pass #####

Метод заменяющий текущее значение в цепочке новым значением, принимает один параметр - новое значение.

    Latte.Promise(function(handle){
        setTimeout(function(){
            handle('test');
        }, 1000);
    }).pass('new value').next(function(value){
        value === 'new value'; // true
    });
    
    Latte.Promise(function(handle){
        setTimeout(function(){
            handle('test');
        }, 1000);
    }).pass(Latte.E('error')).next(function(value){
        // функция не будет вызвана
    }).fail(function(e){
        e.value === 'error' // true;
    });
    
##### elift #####

Метод преобразования значения E. Если метод возвращает не E значение, то считается что тип значения исправлен на успешный. 

    Latte.Promise(function(handle){
        setTimeout(function(){
            handle(Latte.E('error'));
        }, 1000);
    }).elift(function(e, prev){
        return Latte.E('new ' + e.value);
    }).fail(function(e){
        e.value === 'new error'; // true
    });
    
    Latte.Promise(function(handle){
        setTimeout(function(){
            handle(Latte.E('test'));
        }, 1000);
    }).elift(function(value, prev){
        return 'not error';
    }).next(function(value){
        value === 'not error'; // true
    });
    
##### bnd #####

Метод преобразования успешного значения. Метод возвращает новый Promise/Stream, связывая текущий Promise/Stream с новым.

    Latte.Promise(function(handle){
        setTimeout(function(){
            handle('test');
        }, 1000);
    }).bnd(function(value, prev){
        return Latte.Promise(function(handle){
            setTimeout(function(){
                handle(value + '-1');
            }, 2000);
        });
    }).next(function(value){
        value === 'test-1'; // true
    });
    
##### ebnd #####

Метод преобразования значения E. Метод возвращает новый Promise/Stream, связывая текущий Promise/Stream с новым.
Если метод возвращает не E значение, то считается что тип значения исправлен на успешный. В качестве параметра метод 
принимает величину таймаута в миллисекундах.

    Latte.Promise(function(handle){
        setTimeout(function(){
            handle(Latte.E('error'));
        }, 1000);
    }).ebnd(function(value, prev){
        return Latte.Promise(function(handle){
            setTimeout(function(){
                handle('not error');
            }, 2000);
        });
    }).next(function(value){
        value === 'not error'; // true
    });
    
##### wait #####

Метод задержки вызова. Для обещаний метод просто задерживает передачу данных по цепочке, для потоков - задерживает последовательность 
быстрых вызовов до тех пор, пока не сработает таймаут и не будет сгенерировано новых событий.

    Latte.Promise(function(handle){
        setTimeout(function(){
            handle('test');
        }, 1000);
    }).wait(4000).next(function(value){
        value === 'test'; // true
    });
