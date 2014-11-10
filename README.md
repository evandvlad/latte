Библиотека для работы с асинхронным кодом с помощью потоков. Отпределено два вида потоков - изменяемый (MStream) и неизменяемый (IStream).

### Типы значений ###

Для потоков определены два типа данных - L(eft) и R(ight), в чем то аналогичные типу Either в Haskell. Все имеющиеся данные укладываются в
объединение этих типов. Тип Left определяет значение ошибки, либо значение которое должно быть отброшено. В каком то смысле, эти два типа 
задают два канала внутри потока, что позволяет определять обработчики для каждого канала или сразу для обоих. 

Тип L представляет собой объект с меткой, то которой и различается этот тип, тип R - остальные значения не имеющие метки. 
    
    Latte.L('error');
    Latte.isL('error') === false;
    Latte.isL(Latte.L('error')) === true;
    Latte.isR('value') === true;
    Latte.isR(Latte.L()) === false;

Для получения значения есть метод *Latte.val*, он распаковывает значение из типа L, но также может работать и с типом R, у которого нет 
обертки, метод просто возвращает само значение. Есть конструктор значения R - функция возвращающая полученный аргумент без преобразований.

    Latte.val(Latte.L('error')) === 'error';
    Latte.val('value') === 'value';
    Latte.val(Latte.R('value')) === 'value';


### Типы потоков и их создание ###

I(mmutable)Stream - поток с константным значением, значение заданное один раз не может быть изменено.

M(umable)Stream - поток с изменяемым значением, при изменении значения идет вызов обработчиков по цепочке.

Для проверки что значение является потоком и для определения типа потока, заданы методы: *Latte.isStream*, *Latte.isIStream* и *Latte.isMStream*. 

    Latte.isStream({}) === false;

Объекты IStream и MStream реализуют один интерфейс и создаются с помощью конструкторов *Latte.IStream* и *Latte.MStream* соответственно.

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

Конструкторы принимают в качестве параметра функцию инициализации и опционально, контекст для этой функции в качестве второго параметра. Функции 
инициализации передается функция задания значения в поток, принимающая один аргумент. Возвращаемое значение из функции инициализации игнорируется.

Также неизменяемый поток может создан с помощью метода *Latte.pack*

    Latte.pack('value');
    Latte.isStream(Latte.pack('value')) === true;
    Latte.isIStream(Latte.pack()) === true;

Метод принимает значение, которое будет помещено в поток.
Также потоки могут быть созданы с помощью методов *Latte.fun* и *Latte.gen*, которые будут рассмотрены далее.

### Методы потока ###

#### Методы экземпляра ####

Многие из методов экземпляра содержат фильтры на входные значения (L/R значения), если после названия метода идет суффикс L или R 
(*listenL*, *fmapR* и т.д.), то этот метод обрабатывает только указанные типы значений в переданном в него обработчике, если суффикс не указан, 
то обрабатываются оба канала и фильтрации не происходит. 
Методы экземпляра можно условно разбить на несколько категорий:

1. Методы слушатели - *listen*, *listenL*, *listenR*, *log*, *logL*, *logR*.
2. Методы обработки значений - *then*, *thenL*, *thenR*, *fmap*, *fmapL*, *fmapR*, *pass*, *passL*, *passR*.
3. Методы работы с состоянием - *fdip*, *fdipL*, *fdipR*, *cdip*, *cdipL*, *cdipR*.
4. Методы фильтрации потока - *when*, *whenL*, *whenR*, *unless*, *unlessL*, *unlessR*.
5. Методы торможения/ускорения потока - *cdip*, *cdipL*, *cdipR*, *throttle*, *throttleL*, *throttleR*, *debounce*, *debounceL*, *debounceR*.
6. Методы объединения потоков - *any*, *merge*

##### listen (listenL, listenR) #####

Метод прослушивающий изменения потока, принимает в качестве параметра функцию-слушатель и опционально, контекст для нее. 
Возвращаемое методом значение игнорируется.

    Latte.MStream(function(handle){
        setInterval(function(){
            handle(Date.now()); 
        }, 1000); 
    }).listen(function(value){
        console.log('now: ' + value);    
    });

##### then (thenL, thenR) #####

Метод преобразования значения потока, принимает в качестве параметра функцию-обработки и опционально, контекст для нее. 
Метод может вернуть как простое значение, так и экземпляр потока, в таком случае, значение разворачивается и далее 
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

Метод преобразования значения потока, принимает в качестве параметра функцию-обработки и опционально, контекст для нее. 
Данный метод, в отличии от then, не разворачиваетзначение потока, если оно было возвращено функцией-обработчиком.

    Latte.MStream(function(handle){
        setInterval(function(){
            handle(Date.now()); 
        }, 1000); 
    }).then(function(value){
        return 'now: ' + value;
    });

##### pass (passL, passR) #####

Метод выполняющий роль логического оператора 'и'. В случае соответствия типов, возвращается новое значение по цепочке, 
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

Метод фильтрации потока, метод принимает функцию-предикат и опционально, контекст 
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

Метод фильтрации потока, метод принимает функцию-предикат и опционально, контекст 
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

Метод для работы с состоянием, метод принимает функцию инициализации и опционально,
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

Метод для работы с состоянием, метод принимает функцию инициализации и опционально,
контекст для нее. Функция инициализации вызывается при получении первого значения 
потока, она должна вернуть функцию, в которую будет передаваться текущее значение 
потока и которая будет возвращать новое значение.

    Latte.MStream(function(handle){
        setInterval(function(){
            handle(Date.now()); 
        }, 1000); 
    }).fdip(function(){
        var id = 0;
        
        return function(value){
            return {
                value : value,
                id : ++id    
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

Метод вывода текущего значения в консоль (console.log), если она доступна. Метод не принимает параметров. 

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

