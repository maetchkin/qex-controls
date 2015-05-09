ns.input = function(_data){
    var data = _data || '',
        input;
    
    if (typeof data === 'string'){
        input = new ns.models.input({'placeholder':data});
    } else

    if (data instanceof Backbone.Model){
        input = data;
    } else

    if (Object.prototype.toString.call(data) === '[object Object]'){
        input = new ns.models.input(data);
    }

    return input;
}