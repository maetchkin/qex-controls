'use strict';

ns.models.suggest = Backbone.Model.extend(
    {
        'defaults': {
            'select': false,
            'option': false,
            'param':  false,
            'loading':  false,
            'debounce': 150,
            'placeholder': '',
            'size': 'M',
            'min': 0,
            'viewButton': 'i-suggest-input',
            'viewOption': void(0),
            'selected':   void(0),
            'filter':     void(0),
            'sort':       void(0)
        },

        'initialize': function(){
            if(this.get('type') === 'url'){
                this.initURL();
            }
            this.on(
                'change:select',
                this.setSelect
            );
        },

        'load': function(){
            var done = this.set.bind(this, 'loading', false),
                filter = this.setFiltered.bind(this);
            this.get('data').fetch({
                'reset':   true,
                'success': function(){
                    filter();
                    done();
                },
                'error':   done
            });
            this.set('loading', true);
        },

        'initURL': function(){
            this.setUrl();
            if(!this.get('param')){
                this.load();
            }
        },

        'setUrl': function(){
            var suggest = this,
                data    = suggest.get('data'),
                url     = data.url;

            if(url.indexOf('%%input%%') > -1){
                this.set('param', true);
                data.url = function(){
                    return url.replace(
                        /%%input%%/,
                        suggest.get('select').get('input').get('value')
                    );
                }
            }
        },

        'setSelect': function(){
            var option = this.get('option'),
                select = this.get('select');
            if(option){
                if(typeof option === 'string'){
                    select.getOptionLabel = function(optionModel){
                        return optionModel.get(option);
                    }
                } else if(typeof option === 'function'){
                    select.getOptionLabel = option;
                }
            }

            select.on(
                'change:selected',
                this.setSelected,
                this
            );

            select.on(
                'change:input',
                this.setInput,
                this
            );

            select.on(
                'change:rendered',
                this.onRender,
                this
            );

            this.setInput(
                select,
                select.get('input')
            );


        select.set(
            'disabled',
            false
        );
        select.on(
            "change:disabled",
            function(){
                select.set('disabled', false);
            }
        );

        },

        'onRender': function(){
            this.get('select').set('focus', void(0));
            if(this.get('input')){
                setTimeout(
                    function(select){
                        var rendered = select.get('rendered');
                        if(rendered && rendered.length){
                            select.set('focus', rendered[0] );
                        }
                    },
                    50,
                    this.get('select')
                );
            }
        },

        'setSelected': function(){
            var select = this.get('select');
            //select.set('filtered',[]);
            this.set('selected', select.get('selected'));
            setTimeout(
                function(){
                    var input = select.get('input');
                    if(input){
                        input.trigger('focus');
                    }
                },
                50
            );
        },

        'setInput': function(select, input){
            if(input){
                input.set('placeholder', this.get('placeholder'));
                input.set('debounce',    this.get('debounce'));
                this.listenTo(input, 'change:value', this.input);
            }
        },

        'filter': function(option, input){
            return this
                        .get('select')
                        .getOptionLabel(option)
                        .toLowerCase()
                        .indexOf(
                            input ? input.toLowerCase() : ''
                        ) == 0;
        },

        'setFiltered': function(){
            var select = this.get('select'),
                filter = this.get('filter') && (typeof this.get('filter') === 'function') ? this.get('filter') : this.filter,
                sort   = this.get('sort') &&   (typeof this.get('sort')   === 'function') ? this.get('sort')   : false,
                filtered = [];

            this.get('data').models.forEach(
                function (option) {
                    if ( filter && filter.call(this, option, select.get('input').get('value') ) ) {
                        filtered.push(option.cid);
                    }
                },
                this
            );

            /*filtered.sort(
                function(a, b){
                    return  select.getOptionLabel(
                                select.get('options').get(a)
                            ) >
                            select.getOptionLabel(
                                select.get('options').get(b)
                            );
                }
            );*/

            select.set('filtered', filtered);
        },

        'setSuggest': function(open){
            this.setFiltered();
            this.get('select').set('open', open!==false);
        },


        'input': function (input, value) {

            this.set('input', value);

            var str    = value.toLowerCase().trim(),
                select = this.get('select');

            select.reset();

            if(str.length >= this.get('min')){
                if( this.get('param') ){
                    this.get('data').once('sync', this.setSuggest, this);
                    this.load();
                    return;
                }
            } else {
                if( this.get('param') ){
                    this.get('data').once('reset', this.setSuggest, this);
                    this.get('data').reset();
                    return;
                }
            }
            return this.setSuggest();
        }
    }
);
