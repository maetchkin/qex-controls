ns.select = function(data, _options){
    var options = _options || {},
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
                            new Backbone.Collection(
                                data.map(
                                    function(option){
                                        return new Backbone.Model(
                                            {label: option}
                                        )
                                    }
                                )
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
