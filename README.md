[![Build Status](https://travis-ci.org/evandvlad/latte.svg?branch=version-6)](https://travis-ci.org/evandvlad/latte)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/da8aca6f52be4d5d82ef339ef8c2de19)](https://www.codacy.com/app/evandvlad/latte)
[![Codacy Badge](https://api.codacy.com/project/badge/coverage/da8aca6f52be4d5d82ef339ef8c2de19)](https://www.codacy.com/app/evandvlad/latte)

Библиотека для работы с асинхронным кодом с помощью потоков. 
Определено два вида потоков - изменяемый (MStream) и неизменяемый (IStream).

### Типы значений ###

Для значений потоков определены два типа данных - L(eft) и R(ight).
Все имеющиеся значения укладываются в объединение этих типов. 
Тип Left определяет значение которое будет трактоваться как ошибка, 
либо значение, которое должно быть отброшено. В каком то смысле, 
эти два типа задают два канала внутри потока, 
что позволяет определять обработчики для каждого канала или сразу для обоих. 

Тип L представляет собой объект с меткой, по которой и различается этот тип, 
тип R - остальные значения. 
    
    Latte.isL('error') === false;
    Latte.isL(Latte.L('error')) === true;
    Latte.isR('value') === true;
    Latte.isR(Latte.L()) === false;

Метод *Latte.val* распаковывает значение из типа L, но также может работать и 
с типом R, у которого нет обертки, метод просто возвращает сами данные. 
Есть конструктор значения R - функция возвращающая полученный аргумент 
без преобразований.

    Latte.val(Latte.L('error')) === 'error';
    Latte.val('value') === 'value';
    Latte.val(Latte.R('value')) === 'value';


### Типы потоков и их создание ###

I(mmutable)Stream - поток с константным значением, значение заданное один раз не может быть изменено.

M(umable)Stream - поток с изменяемым значением, при изменении значения идет вызов обработчиков по цепочке.

Для проверки что значение является потоком и для определения типа потока, 
заданы методы: *Latte.isStream*, *Latte.isIStream* и *Latte.isMStream*. 

    Latte.isStream({}) === false;

Объекты IStream и MStream реализуют один интерфейс и создаются с 
помощью конструкторов *Latte.IStream* и *Latte.MStream* соответственно.

    Latte.IStream(function(handle){
        setTimeout(function(){
            handle(Date.now()); 
        }, 1000); 
    });

    Latte.MStream(function(handle){
        setInterval(function(){
            handle(Date.now()); 
        }, 1000); 
    });

Конструкторы принимают в качестве параметра функцию инициализации и
контекст для этой функции в качестве второго параметра. 
Функции инициализации передается функция задания значения в поток, 
принимающая один аргумент. Возвращаемое значение из функции 
инициализации игнорируется.

Также потоки могут быть созданы с помощью методов *Latte.fun* и *Latte.gen*, которые будут рассмотрены далее.

### Методы потока ###

#### Методы экземпляра ####

Многие из методов экземпляра содержат фильтры на входные значения (L/R значения), 
если после названия метода идет суффикс L или R (*listenL*, *fmapR* и т.д.), 
то этот метод обрабатывает только указанные типы значений в переданном 
в него обработчике, если суффикс не указан, то обрабатываются оба 
канала и фильтрации не происходит. 
Методы экземпляра можно условно разбить на несколько категорий:

1. Методы слушатели, не изменяющие значений - *listen*, *listenL*, *listenR*, *log*, *logL*, *logR*.
2. Методы обработки значений - *then*, *thenL*, *thenR*, *fmap*, *fmapL*, *fmapR*, *pass*, *passL*, *passR*.
3. Методы работы с состоянием - *fdip*, *fdipL*, *fdipR*, *cdip*, *cdipL*, *cdipR*.
4. Методы фильтрации потока - *when*, *whenL*, *whenR*, *unless*, *unlessL*, *unlessR*.
5. Методы торможения/ускорения потока - *cdip*, *cdipL*, *cdipR*, *throttle*, *throttleL*, *throttleR*, *debounce*, *debounceL*, *debounceR*.
6. Методы объединения потоков - *any*, *merge*

##### listen (listenL, listenR) #####

Метод прослушивающий изменения потока, принимает в качестве параметра 
функцию-слушатель и контекст для нее. Возвращаемое методом значение игнорируется.

    Latte.MStream(function(handle){
        setInterval(function(){
            handle(Date.now()); 
        }, 1000); 
    }).listen(function(value){
        console.log('now: ' + value);    
    });

##### then (thenL, thenR) #####

Метод преобразования значения потока, принимает в качестве параметра 
функцию-обработки и контекст для нее. Метод может вернуть как экземпляр потока, 
так и любое другое значение, в первом случае, значение разворачивается и далее 
по цепочке уже передается это значение.

    Latte.MStream(function(handle){
        setInterval(function(){
            handle(Date.now()); 
        }, 1000); 
    }).then(function(value){
        return Latte.MStream(function(handle){
             setInterval(function(){
                handle({
                    prev : value, 
                    current : Date.now()
                }); 
            }, 1000); 
        });
    });

##### fmap (fmapL, fmapR) #####

Метод преобразования значения потока, принимает в качестве параметра 
функцию-обработки и контекст для нее. Данный метод, в отличии от then, 
не разворачивает значение потока, если оно было возвращено функцией-обработчиком.

    Latte.MStream(function(handle){
        setInterval(function(){
            handle(Date.now()); 
        }, 1000); 
    }).fmapR(function(value){
        return 'now: ' + value;
    });

##### pass (passL, passR) #####

Метод выполняющий роль логического оператора 'и'. 
В случае соответствия типов значений, возвращается новое значение по цепочке, 
в качестве параметра метод принимает как простое значение, так и экземпляр потока.

    Latte.IStream(function(handle){
        setTimeout(function(){
            handle(Date.now()); 
        }, 1000); 
    }).pass('new value'); 

    Latte.IStream(function(handle){
        setTimeout(function(){
            handle(Date.now()); 
        }, 1000); 
    }).passL(Latte.IStream(function(handle){
        setTimeout(function(){
            handle(Latte.L('new error')); 
        }, 1000); 
    })); 
    
##### when (whenL, whenR) #####

Метод фильтрации потока, метод принимает функцию-предикат и контекст 
для нее. Функция-предикат приводит возвращаемое значение к типу Boolean. 
Если значение функции приводится к false, то для данного типа значение далее 
не распространяется.

    Latte.IStream(function(handle){
        setTimeout(function(){
            handle(Date.now()); 
        }, 1000); 
    }).whenR(function(value){
        return value > new Date(2014, 1, 1).valueOf();   
    }); 

    
##### unless (unlessL, unlessR) #####

Метод фильтрации потока, метод принимает функцию-предикат и контекст 
для нее. Функция-предикат приводит возвращаемое значение к типу Boolean. 
Если значение функции приводится к true, то для данного типа значение далее 
не распространяется.

    Latte.IStream(function(handle){
        setTimeout(function(){
            handle(Date.now()); 
        }, 1000); 
    }).unlessR(function(value){
        return value > new Date(2014, 1, 1).valueOf();   
    }); 

##### cdip (cdipL, cdipR) #####

Метод для работы с состоянием, метод принимает функцию инициализации и 
контекст для нее. Функция инициализации вызывается при получении первого значения 
потока и в качестве параметра получает функцию задания значения в поток, она должна
вернуть функцию, в которую будет передаваться текущее значение потока. С помощью 
этого метода также можно разгонять/тормозить поток.

    Latte.MStream(function(handle){
        setInterval(function(){
            handle(Date.now()); 
        }, 1000); 
    }).cdip(function(handle){
        var prev;
        
        return function(value){
            handle({
                current : value,
                prev : prev    
            });
            
            prev = value;    
        };   
    }); 

##### fdip (fdipL, fdipR) #####

Метод для работы с состоянием, метод принимает функцию инициализации и 
контекст для нее. Функция инициализации вызывается при получении первого значения 
потока, она должна вернуть функцию, в которую будет передаваться текущее значение 
потока и которая будет возвращать новое значение.

    Latte.MStream(function(handle){
        setInterval(function(){
            handle(Date.now()); 
        }, 1000); 
    }).fdip(function(){
        var c = 0;
        
        return function(value){
            return {
                value : value,
                count : ++c    
            };
        };   
    }); 

##### debounce (debounceL, debounceR) #####

Метод подтормаживания потока до тех пор, пока не сработает таймаут с момента 
вызова получения последнего значения. Метод принимает значение таймаута в
миллисекундах.

    Latte.MStream(function(handle){
        document.addEventListener('mousemove', handle, false);
    }).debounce(100);

##### throttle (throttleL, throttleR) #####

Метод подтормаживания потока, с помощью заданного таймаута. Метод принимает значение таймаута в миллисекундах.

    Latte.MStream(function(handle){
        setInterval(function(){
            handle(Date.now());
        }, 20);
    }).throttle(100);
    

##### log (logL, logR) #####

Метод вывода текущего значения в консоль (*console.log*), если она доступна. Метод не принимает параметров. 

    Latte.MStream(function(handle){
        setInterval(function(){
            handle(Date.now());
        }, 20);
    }).log();
    
##### any #####

Метод объединения потоков. Метод принимает в качестве параметра значение или список значений и соединяет
их с текущим потоком. В качестве значения могут быть как потоки, так и обычные значения. Новый поток 
будет генерировать событие при любом изменении.

    Latte.MStream(function(handle){
        handle('default value');
    }).any([Latte.MStream(function(handle){
        setTimeout(function(){
            handle('new value');
        }, 100);
    })]); 
    
##### merge #####

Метод объединения потоков. Метод принимает в качестве параметра значение или список значений и соединяет
их с текущим потоком. В качестве значения могут быть как потоки, так и обычные значения. При изменении в качестве значения
будет возвращаться массив всех значений. 

    Latte.MStream(function(handle){
        handle('default value');
    }).merge(['other value', Latte.MStream(function(handle){
        setTimeout(function(){
            handle('new value');
        }, 100);
    })]); 


#### Статические методы ####

##### any #####

Метод с той же функциональностью что и метод any от экземпляра потока, но принимает только массив значений.

    Latte.MStream.any(['value', Latte.MStream(function(handle){
        setTimeout(function(){
            handle('new value');
        }, 100);
    })]); 
    
##### merge #####

Метод с той же функциональностью что и метод merge от экземпляра потока, но принимает только массив значений.

    Latte.MStream.merge(['other value', Latte.MStream(function(handle){
        setTimeout(function(){
            handle('new value');
        }, 100);
    })]); 
    
##### pack #####

Метод для передачи значения в поток.

    Latte.IStream.pack('value'); 
    
##### never #####

Метод создание пустого потока. Метод не принимает аргументов.

    Latte.IStream.never(); 
    
##### lazy #####

Метод создания ленивого потока, в данном случае, функция инициализации вызывается не в момент создания экземпляра,
как в обычном случае, а в момент присоединения к экземпляру обработчика или слушателя потока. Метод принимает 
в качестве параметра функцию инициализации и контекст для нее.

    Latte.IStream.lazy(function(handle){
        setTimeout(function(){
            handle('test');
        }, 100);
    }); 
    
##### shell #####

Метод для ручного управления потоком. Метод возвращает объект с методами *set*, *get* и *out*.
Метод *set* - для передачи значения в поток, метод *out* - возвращает экземпляр потока (один и тот же экземпляр).
С помощью метода *get* можно узнать текущее значение. Метод принимает в качестве параметра значение, которое будет 
возвращено в случае, если значение не было задано, либо еще не вычислено.

    var shell = Latte.MStream.shell();
    
    shell.out().log();
    console.log(shell.get());
    
    shell.set('value-1');
    shell.set('value-2'); 

### Latte.fun & Latte.callback ###

Благодаря методам *Latte.fun* и *Latte.callback* имеется возможность преобразовывать функции работающие с 
callback функциями в потоки Latte.IStream/Latte.MStream.

Метод *Latte.fun* принимает обычную функцию и преобразовывает ее в функцию возвращающую Latte.MStream поток. В качестве 
второго параметра принимается контекст для этой функции.

    Latte.fun(function(a, b, c, d){
        return a + b + c + d;
    })('t', 'e', 's', 't').log();
    
Метод *Latte.callback* принимает callback-функцию и преобразует ее для работы в связке с *Latte.fun*, значение возвращаемое 
из этой функции передавается в поток.

    Latte.fun(setTimeout)(Latte.callback(function(){
        return 'test';
    }), 100).log(); 
    
    Latte.fun(document.addEventListener, document)('mousemove', Latte.callback(function(e){
        return {
            x : e.pageX,
            y : e.pageY
        };
    }), false).debounce(50).log();
    
Можно задать несколько callback функций, если это определено в оригинальной функции, в таком случае, 
вызов любой из них будет передавать значение в поток. 
Чтобы проверить что функция обернута в *Latte.callback*, нужно вызвать метод *Latte.isCallback*

    Latte.isCallback(function(){}) === false;
    Latte.isCallback(Latte.callback(function(){})) === true;
    
### ES6 генераторы ###

Метод *Latte.gen* позволяет работать с ES6 генераторами. Нотация похожа на do-нотацию Haskell при работе с монадами.

    Latte.gen(function*(a, b){
        var c = yield Latte.IStream(function(handle){
                setTimeout(function(){
                    handle('s');
                }, 20);
            }),
            d = yield 't';
            
        return Latte.IStream(function(handle){
            setTimeout(function(){
                handle(a + b + c + d);
            }, 100);
        });    
    })('t', 'e').log(); 
    
Метод может возвращать на любом этапе (yield/return) значение любого типа, в том числе и потоки. 
Если возвращается *Latte.L*, то происходит выход из генератора с возвратом этого значения.
    
### Расширение Latte.IStream/Latte.MStream ###

Метод *Latte.extend* позволяет создать пользовательский тип потока на основе уже имеющихся (IStream/MStream), 
реализуя механизм наследования и копируя статические методы родительского типа.

    var MyStream = Latte.extend(Latte.IStream, {
        method : function(){
            return 'method';
        }
    });

Метод принимает конструктор потока, на основе которого будет построен пользовательский поток и объект, 
расширяющий прототип, если в этом объекте имеется ключ constructor, то функция, заданная по этому ключу, 
будет являться конструктором новой потока.

Второй параметр может быть опущен.

    var MyStream2 = Latte.extend(Latte.MStream);