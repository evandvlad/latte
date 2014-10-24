/**
 * Autor: Evstigneev Andrey
 * Date: 22.10.2014
 * Time: 22:22
 */

core.register('model', function(sandbox){

    'use strict';

    var utils = sandbox.get('utils'),

        STORAGE_KEY = 'TODOS';

    return {

        _todoId : 0,

        init : function(){
            localStorage[STORAGE_KEY] = localStorage[STORAGE_KEY] || JSON.stringify([]);
            return this;
        },

        getTodos : function(){
            return Latte.Promise.init(JSON.parse(localStorage[STORAGE_KEY]));
        },

        getCompletedTodos : function(){
            return this.getTodos().fmap(function(todos){
                return todos.filter(function(todo){
                    return todo.completed;
                });
            });
        },

        getNotCompletedTodos : function(){
            return this.getTodos().fmap(function(todos){
                return todos.filter(function(todo){
                    return !todo.completed;
                });
            });
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

        updateTodos : function(newTodos){
            var newTodosMap = newTodos.reduce(function(acc, todo){
                acc[todo.id] = todo;
                return acc;
            }, {});

            return this.getTodos().fmap(function(todos){
                return this._updateTodos(todos.map(function(todo){
                    return typeof newTodosMap[todo.id] !== 'undefined' ? utils.extend(todo, newTodosMap[todo.id]) : todo;
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
            localStorage[STORAGE_KEY] = JSON.stringify(todos);
            return Latte.Promise.init(todos);
        }
    };

});