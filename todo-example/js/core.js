/**
 * Autor: Evstigneev Andrey
 * Date: 10.07.13
 * Time: 0:25
 */

(function(global, initializer){

    'use strict';

    global.core = initializer();

    if(typeof module !== 'undefined' && module.exports){
        module.exports = global.core;
    }

}(this, function(){

    var modules = Object.create(null),
        sandbox = {

            get : function(name){
                if(!(name in modules)){
                    throw new Error('Module with name: ' + name + ' is not defined');
                }

                return modules[name];
            }
        };

    return {

        version : '4.2.1',
        sandbox : sandbox,
        modules : modules,

        register : function(name, ctor){
            if(name in modules){
                throw new Error('Module with name: ' + name + ' is already exists');
            }

            Object.defineProperty(modules, name, {
                configurable : true,
                get : function(){
                    Object.defineProperty(modules, name, {
                        value : ctor(sandbox),
                        enumerable : true,
                        writable : true
                    });

                    return modules[name];
                }
            });

            return this;
        },

        get : sandbox.get
    };
}));