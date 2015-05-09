
ns.suggest = function(data, _options){

    var options = _options || {},

        item = function(item){
            return {'value':item};
        },

        reURL = /^((?:(?:http|https):\/)?\.?\/.*)$/ ,

        parseURL = function(string){
            return string.match(reURL);
        },

        optionsCollection = function(data){

            if (typeof data === 'string'){
                var url = parseURL(data);
                if(url){
                    var set     = new Backbone.Collection();
                        set.url = data;
                    return [set, "url"];
                } else {
                    var delim = options.delim || ',';
                    return [
                        optionsCollection(data.split(delim))[0],
                        "string"
                    ];
                }
            } else

            if (data instanceof Backbone.Collection){
                return [data, "collection"];
            } else

            if (Object.prototype.toString.call(data) === '[object Array]'){
                return  [
                    new Backbone.Collection(data.map(item)),
                    "array"
                ];
            } else

            if (Object.prototype.toString.call(data) === '[object Object]'){
                options = data;
                data = options.data;
                delete options.data;
                return optionsCollection(data, options);
            } else

            {
                throw new TypeError("TypeError message");
            }
        },

        result = optionsCollection(data);

    options.data = result[0];
    options.type = result[1];

    return new ns.models.suggest( options );
}