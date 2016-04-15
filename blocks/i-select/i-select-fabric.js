ns.select = function(data, _options){
    var options = _options || {},
        parse = Object.prototype.toString.call(options.parse) === '[object Function]'
            ? options.parse
            : function(data) {
                return data instanceof Object
                    ? data
                    : {
                        'label': data,
                        'value': data
                    };
            },
        OptionsCollection = Backbone.Collection.extend({
            'parse': function(data) {
                return data.map(parse);
            }
        }),
        optionsCollection = function(data){

            if (typeof data === 'string'){
                var delim = options.delim || ',';
                return [
                    optionsCollection(data.split(delim))[0],
                    "string"
                ];
            } else

            if (data instanceof Backbone.Collection){
                return [
                    data,
                    "collection"
                ];
            } else

            if (Object.prototype.toString.call(data) === '[object Array]'){
                return  [
                            new OptionsCollection(
                                data,
                                {
                                    'parse': true
                                }
                            ),
                            "array"
                        ]
            } else

            if (Object.prototype.toString.call(data) === '[object Object]'){
                options = data;
                data = options.options;
                delete options.options;
                return optionsCollection(data, options);
            } else

            {
                throw new TypeError("TypeError");
            }
        },
        result = optionsCollection(data);
        options.options = result[0];
        options.type    = result[1];

    return new ns.models.select( options );
}
