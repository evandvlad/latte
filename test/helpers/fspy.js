/**
 * Autor: Evstigneev Andrey
 * Date: 19.03.14
 * Time: 23:01
 */

'use strict';

module.exports = function(opt){

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
