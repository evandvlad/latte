/**
 * Autor: Evstigneev Andrey
 * Date: 22.10.2014
 * Time: 22:27
 */

core.register('utils', function(sandbox){

    'use strict';

    return {

        noop : function(){},

        extend : function(src, dest){
            return Object.keys(src).reduce(function(acc, key){
                if(typeof acc[key] === 'undefined'){
                    acc[key] = src[key];
                }

                return acc;
            }, dest);
        },

        prop : function(p){
            return function(o){
                return o[p];
            };
        },

        inArray : function(arr, value){
            return arr.indexOf(value) !== -1;
        },

        toArray : function(o){
            return Array.prototype.slice.call(o)
        },

        wrapToArray : function(v){
            return [v];
        }
    }
});