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
            'mode':       'radio',
            'disabled': false
        },

        'initialize': function(){
            if(this.get('type') === 'url'){
                this.initURL();
            }
            this.on(
                'change:select',
                this.setSelect
            );
            this.on(
                'change:disabled',
                this.proxyDisabled
            );
        },

        'proxyDisabled': function(model, value) {
            var select = this.get('select'),
                input = select && select.get('input');
            select && select.set(
                'disabled',
                value
            );
            input && input.set(
                'disabled',
                value
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

            
        

        },

        'onRender': function(){
            this.get('select').set('focus', void(0));
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
        },

        'setSelected': function(){
            var select = this.get('select');
            select.set('filtered',{});
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
                input.set('disabled',    this.get('disabled'));
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
                filtered = {};

            this.get('data').models.forEach(
                function (option) {

                    if ( ! filter.call(this, option, select.get('input').get('value') ) ) {
                        filtered[option.cid] = true;
                    }
                },
                this
            );
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

            if(str.length >= this.get('min')){
                if( this.get('param') ){
                    this.get('data').once('sync', this.setSuggest, this);
                    this.load();
                } else {
                    str || this.get('mode') === 'check' || select.reset();
                    this.setSuggest();
                }
            } else {
                if( this.get('param') ){
                    this.get('data').reset();
                }
                select.reset();
                this.setSuggest();
            }
        }
    }
);
