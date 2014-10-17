Библиотека для работы с асинхронным кодом с помощью обещаний (promise) и потоков (stream).

Потоки (Stream) и обещания (Promise) имеют один интерфейс и отличаются тем, что потоки могут изменять внутреннее состояние, 
в то время как обещания - нет, значение может быть задано, но после его задания оно не может быть изменено.

### Создание Promise/Stream ###

Конструкторы примают два параметра - функцию инициализации и опционально, контекст для нее. Функция инициализации принимает в 
качестве параметра функцию изменения внутреннего состояния (для передачи данных в обещание/поток). Если в качестве значения 
передается экземпляр Promise/Stream, по это значение распаковывается. Возвращаемое значение из функции инициализации 
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

Методы: always, next, fail, when, unless, fmap, efmap - принимают в качестве параметров, функцию обработки и контекст для нее 
(опционально). Функция принимает два параметра - текущее значение и предыдущее значение или значение Nothing 
(для обещаний предыдущее значение должно быть Nothing, поскольку при задании значения оно не изменяется). 
Предыдущее значение определяется обработчиком, то есть передаются те значения, которые обрабатываеются функцией.

Методы: combine, any - принимают в качестве параметра одно значение или массив значений. В качестве значения могут выступать
как экземпляры Promise/Stream, так и любые другие значения.

Методы: always, next, fail, log - возвращают текущий экземпляр (используются ради побочных эффектов, 
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
    
##### pass #####

Метод заменяющий текущее значение в цепочке новым значением или новым экземпляром, 
принимает один параметр - новое значение или новый экземпляр Promise/Stream.

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
    }).pass(Latte.Promise(function(handle){
        handle(Latte.E('error'));
    }).next(function(value){
        // функция не будет вызвана
    }).fail(function(e){
        e.value === 'error' // true;
    });
    
##### fmap #####

Метод преобразования успешного значения. При необходимости можно вернуть E значение.
Также может возвращать экземпляр Promise/Stream.

    Latte.Promise(function(handle){
        setTimeout(function(){
            handle('test');
        }, 1000);
    }).fmap(function(value, prev){
        return value + '-1';
    }).next(function(value){
        value === 'test-1'; // true
    });
    
    Latte.Promise(function(handle){
        setTimeout(function(){
            handle('test');
        }, 1000);
    }).fmap(function(value, prev){
        return Latte.Promise(function(handle){
            handle(Latte.E('error'));
        });
    }).next(function(value){
        // функция не будет вызвана
    }).fail(function(e){
        e.value === 'error' // true;
    });
    
##### efmap #####

Метод преобразования значения E. Если метод возвращает не E значение, то считается что тип значения исправлен на успешный.
Также может возвращать экземпляр Promise/Stream.

    Latte.Promise(function(handle){
        setTimeout(function(){
            handle(Latte.E('error'));
        }, 1000);
    }).efmap(function(e, prev){
        return Latte.E('new ' + e.value);
    }).fail(function(e){
        e.value === 'new error'; // true
    });
    
    Latte.Promise(function(handle){
        setTimeout(function(){
            handle(Latte.E('test'));
        }, 1000);
    }).efmap(function(value, prev){
        return Latte.Promise(function(handle){
            handle('not error');
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

##### log #####

Метод логирующий текущие аргументы через вызов console.log. Метод не принимает параметров.

    Latte.Stream(function(handle){
        setInterval(function(){
            handle(Date.now());
        }, 1000);
    }).log();
    
##### combine #####

Метод комбинирующий текущий экземпляр с другими значениями. В качестве результата
будет возврашаться массив данных.

    Latte.Stream(function(handle){
        // ...code
    }).combine([
        Latte.Stream(function(){
            // ...code
        }),
        Latte.Stream(function(){
            // ...code
        }),
        'simple value'
    ]);
    
##### any #####

Метод комбинирующий текущий экземпляр с другими значениями. В качестве результата
будут возврашаться данные от одного экзепляра.

    Latte.Stream(function(handle){
        // ...code
    }).any([
        Latte.Stream(function(){
            // ...code
        }),
        Latte.Stream(function(){
            // ...code
        })
    ]);
    
### Статические методы Promise/Stream ###

Методы collect и any, аналогичны методом combine и any, определенных для экземпляра. Все методы возвращают новый экземпляр.
Методы collectAll, collect, any принимают в качестве параметра массив значений. В качестве значения могут выступать
как экземпляры Promise/Stream, так и любые другие значения.

##### collectAll #####

Метод собирающий данные в список, как успешные, так и нет, если есть хотя бы одно неуспешное 
значение, то весь список упаковывается в Latte.E, в котором содержатся все данные экземпляров.

    Latte.Promise.collectAll(([
        Latte.Promise(function(){
            // ...code
        }),
        Latte.Promise(function(){
            // ...code
        }),
        'simple value'
    ]);

##### collect #####

Метод собирающий успешные данные в список, если хотя бы один результат будет неуспешным, 
то возвращается первое неуспешное значение.

    Latte.Promise.collect(([
        Latte.Promise(function(){
            // ...code
        }),
        Latte.Promise(function(){
            // ...code
        })
    ]);
    
##### any #####

Метод обрабатывающий первое успешное значение из списка. Возвращается это успешное значение.

    Latte.Stream.any([
        Latte.Stream(function(){
            // ...code
        }),
        Latte.Stream(function(){
            // ...code
        })
    ]);
    
##### fun #####

Метод принимает функцию и контекст для нее в качестве опционального параметра и возвращает функцию которая возвращает
объект Promise/Stream. Если переданная функция возвращает не объект Promise/Stream, то возвращаемое значение упаковывается в
необходимую обертку. Функция в качестве аргументов может получать как простые значения, так и значения Promise/Stream, которые 
вычисляются и только потом передаются в качестве параметров. Если хотя бы один из параметров будет E, либо вычислен
как E, то фунция не будет вызвана, но при этом цепочка не прервется.

    Latte.Promise.fun(function(){
        return Array.prototype.slice.call(arguments).toString();
    })(Latte.Promise(function(handle){
        handle('test');
    }), 'rest').always(function(value){
        value === 'test,rest';
    });
    
##### gen #####

Метод принимает генератор и контекст для него в качестве опционального параметра и возвращает функцию которая возвращает
объект Promise/Stream. Если переданная функция возвращает не объект Promise/Stream, то возвращаемое значение упаковывается в
необходимую обертку. Функция в качестве аргументов может получать как простые значения, так и значения Promise/Stream, которые 
вычисляются и только потом передаются в качестве параметров. Если хотя бы один из параметров будет E, либо вычислен
как E, то фунция не будет вызвана, но при этом цепочка не прервется. Внутри генератора если для yield передавать объект 
Promise/Stream, то это значение будет вычисляться. 

    Latte.Promise.gen(function*(a, b){
        var c = yield Latte.Promise(function(handle){
            handle('best');
        });
        
        var d = yield 'west';
        
        return Latte.Promise(function(handle){
            handle([a, b, c, d].toString());
        });
    })(Latte.Promise(function(handle){
        handle('test');
    }), 'rest').always(function(value){
        value === 'test,rest,best,west';
    });
 
##### shell #####    

Метод возвращающий объект, представляющий собой обертку над Promise/Stream объектом, который имеет методы:

-  set - принимает один параметр - значение любого типа и помещает его в Promise/Stream, если в качестве значение будет
экземпляр Promise/Stream, то оно будет развернуто перед тем как помещено в качестве значения в текущий экземпляр.

-  get - возвращает текущее значение или значение типа Nothing, если в объект не было до этого помещено значение.

-  out - метод возвращает сам объект Promise/Stream.

Сам метод не принимает параметров.

    var shell = Latte.Stream.shell();
    
    setInterval(function(){
        shell.set(Date.now());
    }, 1000);
    
    shell.out().always(function(value){
        // value - current timestamp
    });
    
### Latte.extend ###

Метод Latte.extend позволяет создать пользовательскую сущность Promise/Stream на основе имеющихся, реализуя механизм наследования и копируя статические методы родительской сущности.

    var MyPromise = Latte.extend(Latte.Promise, {
        method : function(){
            return 'method';
        }
    });

Метод принимает сущность, на основе которой будет построена пользовательская сущность и объект, расширяющий прототип, если в этом объекте имеется ключ constructor, 
то функция, заданная по этому ключу, будет являться конструктором новой сущности.

Второй параметр может быть опущен.

    var MyStream = Latte.extend(Latte.Stream);