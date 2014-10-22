/**
 * Autor: Evstigneev Andrey
 * Date: 22.10.2014
 * Time: 22:23
 */

core.register('view', function(sandbox){

    'use strict';

    var ENTER_KEY_CODE = 13,

        createDOMEventStream = (function(){
            var streams = {};

            return function(event){
                if(!Object.prototype.hasOwnProperty.call(streams, event)){
                    streams[event] = Latte.Stream(function(listener){
                        document.addEventListener(event, listener, false);
                    });
                }

                return streams[event];
            }
        }());

    return {

        _TODO_ITEM_TAG_NAME : 'li',
        _TODO_ID_ATTR_NAME : 'data-id',
        _TODO_TITLE_CLASS_NAME : 'todo-title',
        _TODO_EDITING_INPUT_CLASS_NAME : 'edit',
        _TODO_EDITING_CLASS_NAME : 'editing',
        _TODO_REMOVE_CLASS_NAME : 'destroy',
        _TODO_TOGGLE_COMPLETE_CLASS_NAME : 'toggle',

        _TOGGLE_ALL_ID : 'toggle-all',
        _NAV_LINK_ACTIVE_CLASS_NAME : 'selected',

        init : function(){
            this.dNewTodo = document.getElementById('new-todo');
            this.dTodoList = document.getElementById('todo-list');
            this.dClearCompletedButton = document.getElementById('clear-completed');
            this.dTodoCounter = document.getElementById('todo-count');
            this.dMainPanel = document.getElementById('main');
            this.dFooterPanel = document.getElementById('footer');
            this.dNavLinks = document.querySelectorAll('#filters a');

            return this;
        },

        paintTodos : function(todos){
            this.dTodoList.innerHTML = '';

            todos.length && this.dTodoList.appendChild(todos.reduce(function(frag, todo){
                frag.appendChild(this._createTodo(todo));
                return frag;
            }.bind(this), document.createDocumentFragment()));

            return this;
        },

        paintNewTodo : function(todo){
            this.dTodoList.insertBefore(this._createTodo(todo), this.dTodoList.firstChild);
            return this;
        },

        onCreateNewTodo : function(){
            return createDOMEventStream('keypress')
                .when(function(e){
                    return e.target === this.dNewTodo && e.keyCode === ENTER_KEY_CODE;
                }, this)
                .fmap(function(e){
                    return e.target.value.trim();
                })
                .when(Boolean)
                .next(function(){
                    this.dNewTodo.value = '';
                }, this)
        },

        onRemoveTodo : function(){
            return createDOMEventStream('click')
                .when(function(e){
                    return e.target.classList.contains(this._TODO_REMOVE_CLASS_NAME);
                }, this)
                .fmap(function(e){
                    return e.target.getAttribute(this._TODO_ID_ATTR_NAME);
                }, this)
                .next(this._removeTodo, this);
        },

        onEditTitleTodo : function(){
            return Latte.Promise(function(){});
        },

        onToggleCompletedTodo : function(){
            return Latte.Promise(function(){});
        },

        _createTodo : function(data){
            var item = document.createElement(this._TODO_ITEM_TAG_NAME);

            item.setAttribute(this._TODO_ID_ATTR_NAME, data.id);
            data.completed && item.classList.add('completed');

            item.innerHTML = '<div class = "view">'
                +'<input class = "' + this._TODO_TOGGLE_COMPLETE_CLASS_NAME + '" type = "checkbox" ' + (data.completed ? 'checked' : '') + '>'
                +'<label class = "' + this._TODO_TITLE_CLASS_NAME + '">' + data.title + '</label>'
                +'<button class = "' + this._TODO_REMOVE_CLASS_NAME + '" ' + this._TODO_ID_ATTR_NAME + ' = "' + data.id + '"></button>'
                +'</div>';

            return item;
        },

        _removeTodo : function(id){
            var dTodo = this._getTodoItemById(id);
            dTodo && dTodo.parentNode.removeChild(dTodo);
            return this;
        },

        _getTodoItemById : function(id){
            return this.dTodoList.querySelector(
                    this._TODO_ITEM_TAG_NAME + '[' + this._TODO_ID_ATTR_NAME + '="' + id + '"]'
            );
        }
    };
});