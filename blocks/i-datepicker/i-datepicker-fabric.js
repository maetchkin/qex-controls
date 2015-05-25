ns.date = function(options) {
    var toString = Object.prototype.toString,
        datatype = toString.call(options).slice(8,-1)
        params;
    options = options || {};
    params = {
        'type': options.type || 'from',
        'date': options.date ? new Date(options.date) : new Date(),
        'placeholder': options.placeholder || 'Select a date'
    };
    if (options === 'to' || options === 'from') {
        return ns.date({
            'type': options
        })
    }
    if (datatype === 'Date' || datatype === 'String') {
        return ns.date({
            'date': options
        })
    }
    
    return new ns.models.date(params);
}