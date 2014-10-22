/**
 * Autor: Evstigneev Andrey
 * Date: 22.10.2014
 * Time: 22:26
 */

core.register('presenter', function(sandbox){

    'use strict';

    return {

        init : function(model, view){
            model.getTodos().next(view.paintTodos, view);

            view.onCreateNewTodo()
                .fmap(model.createTodo, model)
                .next(view.paintNewTodo, view);

            view.onRemoveTodo()
                .fmap(model.removeTodo, model);

            Latte.Stream.any([view.onEditTitleTodo(), view.onToggleCompletedTodo()])
                .fmap(model.updateTodo, model);

            return this;
        }
    }

});