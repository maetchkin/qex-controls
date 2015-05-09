ns.buttongroup = function(data, _options){
    var options = _options || {},

        _default = (ns.button('_default')).attributes,

        button = function (buttonOptions) {
            var result = {}, str = false;
            if(typeof buttonOptions === 'string'){
                result = {label: buttonOptions};
                str = true;
            } else if (buttonOptions instanceof Backbone.Model){
                result = buttonOptions.attributes;
            } else if (Object.prototype.toString.call(buttonOptions) === '[object Object]'){
                result = buttonOptions;
            } else {
                throw new TypeError("unknown button type");
            }
            for(var p in _default){
                if(p !== 'label'){
                    result[p] = !str && (p in buttonOptions)
                        ? buttonOptions[p]
                        :   (p in options
                                ? options[p]
                                : _default[p]
                            );
                }
            }
            return ns.button(result);
        },

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
                    new Backbone.Collection(data.map(button)),
                    "collection"
                ];
            } else

            if (Object.prototype.toString.call(data) === '[object Array]'){
                return  [
                    new Backbone.Collection(data.map(button)),
                    "array"
                ];
            } else

            if (Object.prototype.toString.call(data) === '[object Object]'){
                options = data;
                data = options.buttons;
                delete options.buttons;
                return optionsCollection(data, options);
            } else

            {
                throw new TypeError("TypeError");
            }
        },

        result = optionsCollection(data);

    options.buttons = result[0];
    options.type    = result[1];

    return new ns.models.buttongroup( options );
}
