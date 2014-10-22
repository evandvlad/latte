/**
 * Autor: Evstigneev Andrey
 * Date: 22.10.2014
 * Time: 15:45
 */

(function(win, doc, main){

    'use strict';

    var model = core.get('model'),
        view = core.get('view'),
        presenter = core.get('presenter');

    main(model, view, presenter);

}(window, document, function(m, v, p){

    'use strict';

    Latte.Promise.fun(document.addEventListener, document)('DOMContentLoaded', Latte.callback(function(){}), false)
        .next(function(){
            p.init(m.init(), v.init());
        });
}));