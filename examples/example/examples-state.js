window.exampleState = (function (location) {
    var state,
        dls   = document.location.search,
        query = dls,
        query = query.substr(1, query.length).split('&');
        query = (function(query){
            var res = {};
            query.forEach(
                function(param){
                    var pair = param.split('=');
                    res[pair[0]] = pair[1] || true;
                }
            );
            return res;
        })(query),
        params = {
            'framework': dls.indexOf('backbone') >-1 ? 'backbone' : 'exoskeleton',
            '$':         dls.indexOf('jQuery')   >-1 ? 'jQuery'   : 'zepto',
            'runtest':   query['runtest'] || false,
            'one':       query['one']     || false
        };

    state = {

        'params': params,

        'name': function(str){
            return str.toLowerCase().replace(/[\.\s\-]/g,'_');
        },

        'url': function(options){

            var framework = options.framework || params.framework,
                $  = options.$ || params.$,
                f$ = framework + "&" + $,
                result = "?" + (f$ === 'exoskeleton&zepto' ? '' :  f$);

            if(options.section){
                result += "#" + options.section;
            }
            if(options.block){
                result += (params.one ? ("&one=" + options.block) : ("#"+ state.name(options.block)) );
            }
            if(options.sub){
                result += (params.one ? "#" +  state.name(options.block) : "") + '__' + state.name(options.sub);
            }
            if(options.runtest){
                result += '&runtest';
            }

            return './' + result;
        }
    };

    return state;
})(window.location);