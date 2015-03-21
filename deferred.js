/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-7-9
 * Time: 下午9:56
 * To change this template use File | Settings | File Templates.
 */

;(function(window){
    if(window.deferred){
        return;
    }

    var deferred = function(){
        var _this = this;
        _this.state = "default";
        _this.value = "";
        _this.successCallbacklist = [];
        _this.errorCallbacklist = [];

        _this.promise = new promise(_this);
    };

    //deferred失败接口，接收失败或者错误参数
    deferred.prototype.resolve = function (value){
        if(this.state == "default"){
            this.state = "resolved";
            this.value = value;

            for(var i= 0;i < this.successCallbacklist.length;i++){
                this.promise.success(this.successCallbacklist[i]);
            }
        }
    };

    //deferred成功接口，接收数据参数
    deferred.prototype.reject = function (value){
        if(this.state == "default"){
            this.state = "rejected";
            this.value = value;

            for(var i= 0;i < this.errorCallbacklist.length;i++){
                this.promise.error(this.errorCallbacklist[i]);
            }
        }
    };

    function promise(def){
        this.def = def;

        this.__type__ = "promiseA";
    }

    //注册成功回调方法和失败回调方法
    promise.prototype.then = function (succCallback, errCallback){
        return this.success(succCallback).error(errCallback);
    };

    //注册成功回调方法
    promise.prototype.success = function (callback){
        if(this.def.state == "resolved"){
            var tempValue = callback.call(this, this.def.value);
            if(tempValue){
                if(tempValue.__type__ == "promiseA"){
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
        if(this.def.state == "rejected"){
            var tempValue = callback.call(this, this.def.value);
            if(tempValue){
                if(tempValue.__type__ == "promiseA"){
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

    //注册所有promise对象
    promise.prototype.all = function(promises){
        promises = promises instanceof Array ? promises : [promises];
        var len = promises.length;
        for(var i=0; i < len;i++){
            (function(i){
                promises[i].then(function(){
                    var state = true,
                        args = [];
                    for(var n=0;n < len;n++){
                        if(promises[n]._getState() == "rejected" || promises[n]._getState() == "default"){
                            state = false;
                        }else{
                            args.push(promises[n]._getValue());
                        }
                    }
                    if(state){
                        this.def.resolve(args);
                    }
                }, function(){
                    var state = true,
                        args = [];
                    for(var n=0;n < len;n++){
                        if(promises[n]._getState() == "resolved" || promises[n]._getState() == "default"){
                            state = false;
                        }else{
                            args.push(promises[n]._getValue());
                        }
                    }
                    if(state){
                        this.def.reject(args);
                    }
                });
            })(i)
        }

        return this;
    };

    //注册所有promise对象和成功回调函数、失败回调函数
    promise.prototype.when = function(promise, succCallback, errCallback){
        if(promise instanceof Array || promise.__type__ == "promiseA"){
            return this.all(promise).success(succCallback).error(errCallback);
        }else{
            this.def.resolve(promise);
            return this.success(succCallback).error(errCallback);
        }
    };

    window.deferred = deferred;

})(window);