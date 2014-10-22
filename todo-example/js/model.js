/**
 * Autor: Evstigneev Andrey
 * Date: 22.10.2014
 * Time: 22:22
 */

core.register('model', function(sandbox){

    'use strict';

    return {

        _STORAGE_KEY : 'TODOS',

        _todoId : 0,

        init : function(){
            localStorage[this._STORAGE_KEY] = localStorage[this._STORAGE_KEY] || JSON.stringify([]);
            return this;
        },

        getTodos : function(){
            return Latte.Promise.shell().set(JSON.parse(localStorage[this._STORAGE_KEY])).out();
        },

        createTodo : function(data){
            return this.getTodos().fmap(function(todos){
                var todo = {
                    id : Date.now() + '-' + (++this._todoId),
                    title : data.title,
                    completed : false
                };

                todos.unshift(todo);

                return this._updateTodos(todos).pass(todo);
            }, this)
        },

        updateTodo : function(id, newData){
            return this.getTodos().fmap(function(todos){
                return this._updateTodos(todos.map(function(todo){
                    return todo.id === id ? extend(todo, newData) : todo;
                }));
            }, this);
        },

        removeTodo : function(id){
            return this.getTodos().fmap(function(todos){
                var todoPairs = todos.reduce(function(acc, todo){
                    todo.id === id ? (acc[0] = todo) : acc[1].push(todo);
                    return acc;
                }, [{}, []]);

                return this._updateTodos(todoPairs[1]).pass(todoPairs[0]);
            }, this);
        },

        _updateTodos : function(todos){
            localStorage[this._STORAGE_KEY] = JSON.stringify(todos);
            return Latte.Promise.shell().set(todos).out();
        }
    };

});