/**
 * Autor: Evstigneev Andrey
 * Date: 02.11.2014
 * Time: 22:22
 */

(function(global, initializer){

    global.Latte = initializer();
    global.Latte.version = '6.0.0';

    if(typeof module !== 'undefined' && module.exports){
        module.exports = global.Latte;
    }

}(this, function(){

    'use strict';

    var Latte = {},

        PROP_L = '_____####![L]',
        PROP_PROMISE = '_____####![PROMISE]',
        PROP_STREAM = '_____####![STREAM]',

        toString = Object.prototype.toString;

    function lift(v){
        return function(f){
            return f(v);
        };
    }

    function isEntity(key, v){
        return toString.call(v) === '[object Object]' && !!v[key];
    }

    function Build(params){

        function Entity(executor, ctx){
            if(!(this instanceof Entity)){
                return new Entity(executor, ctx);
            }

            this[Latte._KEY_PRIVATE_STATE_PROP] = new Latte._State(bind(executor, ctx), params);
            this[Latte._KEY_PRIVATE_STATE_PROP].init();
        }

        Entity.prototype.listen = function(){

        };

        Entity.prototype.listenL = function(){
            
        };

        Entity.prototype.listenR = function(){
            
        };

        Entity.prototype.fthen = function(){

        };

        Entity.prototype.fthenL = function(){
            
        };

        Entity.prototype.fthenR = function(){
            
        };

        Entity.prototype.fdip = function(){

        };

        Entity.prototype.fdipL = function(){
            
        };

        Entity.prototype.fdipR = function(){
            
        };

        Entity.prototype.pass = function(){

        };

        Entity.prototype.passL = function(){
            
        };

        Entity.prototype.passR = function(){
            
        };

        Entity.prototype.when = function(){

        };

        Entity.prototype.whenL = function(){
            
        };

        Entity.prototype.whenR = function(){
            
        };

        Entity.prototype.unless = function(){

        };

        Entity.prototype.unlessL = function(){
            
        };

        Entity.prototype.unlessR = function(){
            
        };

        Entity.prototype.debounce = function(){

        };

        Entity.prototype.debounceL = function(){
            
        };

        Entity.prototype.debounceR = function(){
            
        };

        Entity.prototype.throttle = function(){

        };

        Entity.prototype.throttleL = function(){
            
        };

        Entity.prototype.throttleR = function(){
            
        };

        Entity.prototype.any = function(){

        };

        Entity.prototype.anyL = function(){
            
        };

        Entity.prototype.anyR = function(){
            
        };

        Entity.prototype.merge = function(){

        };

        Entity.prototype.mergeL = function(){
            
        };

        Entity.prototype.mergeR = function(){
            
        };

        Entity.prototype.gthen = function(){

        };

        Entity.prototype.gthenL = function(){
            
        };

        Entity.prototype.gthenR = function(){
            
        };

        Entity.prototype.gmult = function(){

        };

        Entity.prototype.gmultL = function(){
            
        };

        Entity.prototype.gmultR = function(){
            
        };

        Entity.prototype.gdiv = function(){

        };

        Entity.prototype.gdivL = function(){
            
        };

        Entity.prototype.gdivR = function(){
            
        };

        Entity.prototype.log = function(){

        };

        Entity.prototype.logL = function(){
            
        };

        Entity.prototype.logR = function(){
            
        };

        Entity.init = function(){

        };

        Entity.any = function(){

        };

        Entity.anyL = function(){
            
        };

        Entity.anyR = function(){
            
        };

        Entity.merge = function(){
            
        };
        
        Entity.mergeL = function(){
            
        };

        Entity.mergeR = function(){
            
        };

        Entity.fun = function(){
            
        };

        Entity.funL = function(){
            
        };

        Entity.funR = function(){
            
        };

        Entity.gen = function(){
            
        };

        Entity.genL = function(){
            
        };

        Entity.genR = function(){
            
        };

        Entity.shell = function(){
            
        };

        Object.defineProperty(Entity.prototype, params.key, {value : true});

        return Entity;
    }

    Latte.Promise = Build({immutable : true, key : PROP_PROMISE});
    Latte.Stream = Build({immutable : false, key : PROP_STREAM});

    Latte.isPromise = bind(isEntity, null, PROP_PROMISE);
    Latte.isStream = bind(isEntity, null, PROP_STREAM);

    Latte.isLatte = function(v){
        return Latte.isPromise(v) || Latte.isStream(v);
    }; 

    Latte.L = function(v){
        return Object.defineProperty({value : v}, PROP_L, {value : true});
    };

    Latte.isL = bind(isEntity, null, PROP_L);
    Latte.isR = function(v){
        return !Latte.isL(v); 
    };


    Latte._KEY_PRIVATE_STATE_PROP = '_____####![state]'; 

    Latte._State = function(executor, params){
        this._executor = executor;
        his._params = params;
        this._queue = [];
        this._val = this.constructor.NOTHING;
    };

    Latte._State.prototype.init = function(){
        return this._executor(bind(this.set, this));
    };

    Latte._State.prototype.on = function(f){
        this._queue && this._queue.push(f);
        !this._isNothing(this._val) && f(this._val);
        return this;
    };

    Latte._State.prototype.get = function(){
        return this._val;
    };

    Latte._State.prototype.set = function(v){
        if(this._isNothing(this._val) || !this._params.immutable){
            this._val = v;
            this._queue && this._queue.forEach(lift(this._val), this);
            this._params.immutable && (this._queue = null);
        }
        return this;
    };

    Latte._State.prototype._isNothing = function(v){
        return v === this.constructor.NOTHING;
    };

    Latte._State.NOTHING = new String('NOTHING');

    return Latte; 
    
}));