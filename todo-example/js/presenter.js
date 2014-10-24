/**
 * Autor: Evstigneev Andrey
 * Date: 22.10.2014
 * Time: 22:26
 */

core.register('presenter', function(sandbox){

    'use strict';

    var utils = sandbox.get('utils'),

        URL_HASHES = {
            ALL : '/',
            ACTIVE : '/active',
            COMPLETED : '/completed'
        };

    return {

        init : function(model, view){
            this.model = model;
            this.view = view;

            Latte.Stream.any([Latte.Promise.init(window.location.href), this._onHashChange()])
                .fmap(this._extractHashFromUrl, this)
                .when(this._isValidHash, this)
                .next(view.setActiveHash, view)
                .fmap(this._loadTodosByHash, this)
                .next(view.paintTodos, view);

            view.onCreateNewTodo()
                .fmap(model.createTodo, model)
                .next(view.paintNewTodo, view);

            view.onRemoveTodo()
                .fmap(model.removeTodo, model);

            Latte.Stream.any([
                view.onEditTitleTodo().fmap(utils.wrapToArray),
                view.onToggleCompletedTodo().fmap(utils.wrapToArray),
                view.onToggleCompletedTodos()
            ]).fmap(model.updateTodos, model);

            return this;
        },

        _onHashChange : function(){
            return Latte.Stream.fun(window.addEventListener, window)('hashchange', Latte.callback(utils.prop('newURL'), this), false);
        },

        _extractHashFromUrl : function(url){
            var hashIndex = url.indexOf('#');
            return hashIndex !== -1 ? url.slice(hashIndex + 1) : '';
        },

        _isValidHash : function(hash){
            return Object.keys(URL_HASHES).some(function(key){
                return URL_HASHES[key] === hash;
            });
        },

        _loadTodosByHash : function(hash){
            switch(hash){
                case URL_HASHES.ALL :
                    return this.model.getTodos();

                case URL_HASHES.COMPLETED :
                    return this.model.getCompletedTodos();

                case URL_HASHES.ACTIVE :
                    return this.model.getNotCompletedTodos();
            }
        }
    }

});