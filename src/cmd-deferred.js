/**
 * Created by liudan on 15/3/21.
 */
;define(function(require, exports, module){
    var forEach = (function(){
        if(Array.prototype.forEach){
            return function(arr, fn){
                Array.prototype.forEach.call(arr, fn);
            }
        }else {
            return function(arr, fn){
                for(var i= 0, ln = arr.length;i < ln;i++){
                    fn(arr[i], i);
                }
            }
        }
    })();

    var deferred = function(){
        var _this = this;
        _this.state = "default";
        _this.value = "";
        _this.successCallbacklist = [];
        _this.errorCallbacklist = [];

        _this.promise = new promise(_this);
    };

    //deferred成功接口，接收数据参数
    deferred.prototype.resolve = function (value){
        if(this.state == "default"){
            this.state = "resolved";
            this.value = value;

            var _this = this;
            forEach(this.successCallbacklist, function(item){
                _this.promise.success(item);
            });
        }
    };

    //deferred失败接口，接收失败或者错误参数
    deferred.prototype.reject = function (value){
        if(this.state == "default"){
            this.state = "rejected";
            this.value = value;

            var _this = this;
            forEach(this.errorCallbacklist, function(item){
                _this.promise.error(item);
            });
        }
    };

    var type = "promiseA";

    function promise(def){
        this.def = def;
    }

    //注册成功回调方法和失败回调方法
    promise.prototype.then = function (succCallback, errCallback){
        return this.success(succCallback).error(errCallback);
    };

    //注册成功或者失败的回调方法
    promise.prototype.always = function(callback){
        return this.success(callback).error(callback);
    };

    //注册成功回调方法
    promise.prototype.success = function (callback){
        if (typeof callback !== 'function') {
            return this.def.promise;
        }

        if(this.def.state == "resolved"){
            var tempValue = callback.call(this, this.def.value);
            if(tempValue){
                if(tempValue._getType && tempValue._getType()  == "promiseA"){
                    this.def.promise = tempValue;
                }else{
                    this.def.value = tempValue
                }
            }
        }else{
            this.def.successCallbacklist.push(callback);
        }
        return this.def.promise;
    };

    //注册失败回调方法
    promise.prototype.error = function(callback){
        if (typeof callback !== 'function') {
            return this.def.promise;
        }

        if(this.def.state == "rejected"){
            var tempValue = callback.call(this, this.def.value);
            if(tempValue){
                if(tempValue._getType && tempValue._getType() == "promiseA"){
                    this.def.promise = tempValue;
                }else{
                    this.def.value = tempValue
                }
            }
        }else{
            this.def.errorCallbacklist.push(callback);
        }
        return this.def.promise;
    };

    //私有方法，获取deferred当前的状态
    promise.prototype._getState = function(){
        return this.def.state;
    };

    //私有方法，获取deferred的value
    promise.prototype._getValue = function(){
        return this.def.value;
    };

    //私有方法，获取promise对象type，用于判断是否为promise对象
    promise.prototype._getType = function(){
        return type;
    };

    //注册所有promise对象
    promise.prototype.all = function(promises){
        var _this = this;
        promises = promises instanceof Array ? promises : [promises];

        forEach(promises, function(item){
            item.always(function(){
                var state = true,
                    isState = true,
                    args = [];

                forEach(promises, function(pro){
                    if(isState){
                        if(pro._getState() === "default"){
                            state = false;
                        }else {
                            if(pro._getState() === "rejected"){
                                isState = false;
                                args = pro._getValue();
                            }else {
                                args.push(pro._getValue());
                            }
                        }
                    }
                });

                if(isState){
                    if(state){
                        _this.def.resolve(args);
                    }
                }else {
                    _this.def.reject(args);
                }
            });
        });

        return this;
    };

    //注册所有promise对象和成功回调函数、失败回调函数
    promise.prototype.when = function(promise, succCallback, errCallback){
        if((promise instanceof Array && promise.length) ||
            (promise._getType && promise._getType() == "promiseA")){
            return this.all(promise).success(succCallback).error(errCallback);
        }else{
            this.def.resolve(promise);
            return this.success(succCallback).error(errCallback);
        }
    };

    module.exports = deferred;
});