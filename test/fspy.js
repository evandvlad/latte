/**
 * Autor: Evstigneev Andrey
 * Date: 19.03.14
 * Time: 23:01
 */

(function(global, initializer){

    'use strict';

    global.fspy = initializer();
    global.fspy.version = '0.0.1';

    if(typeof module !== 'undefined' && module.exports){
        module.exports = global.fspy;
    }

}(this, function(){

    return function(opt){

        opt = opt || {};

        function f(){

            f.called = true;
            f.count += 1;
            f.args = arguments;

            return typeof opt.onReply === 'function' ? opt.onReply({
                args : arguments,
                context : this
            }) : opt.reply;
        }

        f.called = false;
        f.count = 0;
        f.args = null;

        f.reset = function(){
            f.called = false;
            f.count = 0;
            f.args = null;
        };

        return f;
    };
}));