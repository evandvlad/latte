/**
 * Autor: Evstigneev Andrey
 * Date: 22.10.2014
 * Time: 22:23
 */

core.register('view', function(sandbox){

    'use strict';

    var utils = sandbox.get('utils'),

        ENTER_KEY_CODE = 13,
        TODO_ITEM_TAG_NAME = 'li',
        TODO_ID_ATTR_NAME = 'data-id',
        TODO_TITLE_CLASS_NAME = 'todo-title',
        TODO_EDITING_INPUT_CLASS_NAME = 'edit',
        TODO_EDITING_CLASS_NAME = 'editing',
        TODO_REMOVE_CLASS_NAME = 'destroy',
        TODO_TOGGLE_COMPLETE_CLASS_NAME = 'toggle',
        TODO_COMPLETED_CLASS_NAME = 'completed',
        TODO_ALL_COMPLETED_ID = 'toggle-all',
        NAV_LINK_ACTIVE_CLASS_NAME = 'selected',

        createDOMEventStream = (function(){
            var isCaptureMode = utils.inArray.bind(null, ['blur']),
                streams = {};

            return function(event){
                if(!Object.prototype.hasOwnProperty.call(streams, event)){
                    streams[event] = Latte.Stream(function(listener){
                        document.addEventListener(event, listener, isCaptureMode(event));
                    });
                }

                return streams[event];
            }
        }());

    return {

        init : function(){
            this.dNewTodo = document.getElementById('new-todo');
            this.dTodoList = document.getElementById('todo-list');
            this.dClearCompletedButton = document.getElementById('clear-completed');
            this.dTodoCounter = document.getElementById('todo-count');
            this.dMainPanel = document.getElementById('main');
            this.dFooterPanel = document.getElementById('footer');
            this.dNavLinks = document.querySelectorAll('#filters a');

            this._onNavLinkChange();

            return this;
        },

        setActiveHash : function(hash){
            var active = utils.toArray(this.dNavLinks).filter(function(link){
                    return link.hash.slice(1) === hash;
                })[0];

            active && this._toggleActiveNavLink(active);

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
                .fmap(function(title){
                    return {
                        title : title
                    };
                });
        },

        onRemoveTodo : function(){
            return createDOMEventStream('click')
                .when(function(e){
                    var target = e.target;
                    return this.dTodoList.contains(target) && target.classList.contains(TODO_REMOVE_CLASS_NAME);
                }, this)
                .fmap(function(e){
                    return this._lookupTodoItem(e.target).getAttribute(TODO_ID_ATTR_NAME);
                }, this)
                .next(this._removeTodo, this);
        },

        onEditTitleTodo : function(){
            return createDOMEventStream('dblclick')
                .when(function(e){
                    var target = e.target;
                    return this.dTodoList.contains(target) && target.classList.contains(TODO_TITLE_CLASS_NAME);
                }, this)
                .fmap(function(e){
                    var target = e.target,
                        item = this._lookupTodoItem(target),
                        text = target.textContent;

                    this._makeTodoEditable(this._lookupTodoItem(target), text);

                    return {
                        id : item.getAttribute(TODO_ID_ATTR_NAME),
                        title : text
                    };
                }, this)
                .combine(this._onEditTodoFocusout())
                .when(function(data){
                    return data[0].title !== data[1].title;
                }, this)
                .fmap(utils.prop(1))
                .next(this._updateTodoTitle, this);
        },

        onToggleCompletedTodos : function(){
            return createDOMEventStream('click')
                .when(function(e){
                    return e.target.id === TODO_ALL_COMPLETED_ID;
                })
                .fmap(function(e){
                    var isChecked = e.target.checked;
                    return utils.toArray(this.dTodoList.children).reduce(function(acc, todo){
                        if(isChecked !== todo.classList.contains(TODO_COMPLETED_CLASS_NAME)){
                            todo.querySelector('.' + TODO_TOGGLE_COMPLETE_CLASS_NAME).click();
                            acc.push({
                                id : todo.getAttribute(TODO_ID_ATTR_NAME),
                                completed : !isChecked
                            })
                        }

                        return acc;
                    }, []);
                }, this)
                .when(utils.prop('length'));
        },

        onToggleCompletedTodo : function(){
            return createDOMEventStream('click')
                .when(function(e){
                    var target = e.target;
                    return this.dTodoList.contains(target) && target.classList.contains(TODO_TOGGLE_COMPLETE_CLASS_NAME);
                }, this)
                .fmap(function(e){
                    var target = e.target,
                        item = this._lookupTodoItem(target);

                    this._toggleTodoComplete(item, target);

                    return {
                        id : item.getAttribute(TODO_ID_ATTR_NAME),
                        completed : target.checked
                    };
                }, this);
        },

        _onEditTodoFocusout : function(){
            return createDOMEventStream('blur')
                .when(function(e){
                    var target = e.target;
                    return this.dTodoList.contains(target) && target.classList.contains(TODO_EDITING_INPUT_CLASS_NAME);
                }, this)
                .when(function(e){
                    return e.target.value.trim();
                }, this)
                .fmap(function(e){
                    var target = e.target,
                        item = this._lookupTodoItem(target),
                        value = target.value.trim();

                    this._makeTodoNotEditable(item, target);

                    return {
                        id : item.getAttribute(TODO_ID_ATTR_NAME),
                        title : value
                    };
                }, this);
        },

        _onNavLinkChange : function(){
            return createDOMEventStream('click')
                .when(function(e){
                    return utils.inArray(utils.toArray(this.dNavLinks), e.target);
                }, this)
                .next(function(e){
                    this._toggleActiveNavLink(e.target);
                }, this);
        },

        _toggleActiveNavLink : function(active){
            utils.toArray(this.dNavLinks).forEach(function(link){
                link.classList.remove(NAV_LINK_ACTIVE_CLASS_NAME);
            }, this);

            active.classList.add(NAV_LINK_ACTIVE_CLASS_NAME);

            return this;
        },

        _createTodo : function(data){
            var item = document.createElement(TODO_ITEM_TAG_NAME);

            item.setAttribute(TODO_ID_ATTR_NAME, data.id);
            data.completed && item.classList.add(TODO_COMPLETED_CLASS_NAME);

            item.innerHTML = '<div class = "view">'
                +'<input class = "' + TODO_TOGGLE_COMPLETE_CLASS_NAME + '" type = "checkbox" ' + (data.completed ? 'checked' : '') + '>'
                +'<label class = "' + TODO_TITLE_CLASS_NAME + '">' + data.title + '</label>'
                +'<button class = "' + TODO_REMOVE_CLASS_NAME + '"></button>'
                +'</div>';

            return item;
        },

        _removeTodo : function(id){
            var dTodo = this._getTodoItemById(id);
            dTodo && dTodo.parentNode.removeChild(dTodo);
            return this;
        },

        _toggleTodoComplete : function(dItem, dSelector){
            dItem.classList[dSelector.checked ? 'add' : 'remove'](TODO_COMPLETED_CLASS_NAME);
            return this;
        },

        _updateTodoTitle : function(data){
            this._getTodoItemById(data.id).querySelector('.' + TODO_TITLE_CLASS_NAME).textContent = data.title;
            return this;
        },

        _makeTodoEditable : function(dItem, text){
            var input = document.createElement('input');

            input.type = 'text';
            input.value = text;
            input.classList.add(TODO_EDITING_INPUT_CLASS_NAME);

            dItem.classList.add(TODO_EDITING_CLASS_NAME);
            dItem.appendChild(input);
            input.focus();

            return this;
        },

        _makeTodoNotEditable : function(dItem, dInput){
            dItem.classList.remove(TODO_EDITING_CLASS_NAME);
            dInput.parentNode.removeChild(dInput);
            return this;
        },

        _getTodoItemById : function(id){
            return this.dTodoList.querySelector(TODO_ITEM_TAG_NAME + '[' + TODO_ID_ATTR_NAME + '="' + id + '"]');
        },

        _lookupTodoItem : function(dDescendant){
            var item = dDescendant;

            while(item && !item.hasAttribute(TODO_ID_ATTR_NAME)){
                item = item.parentNode;
            }

            return item;
        }
    };
});