ns.models.select = Backbone.Model.extend(
    {
        'defaults': {
            'selected':    null,
            'open':        false,
            'size':        'M',
            'placeholder': 'none',
            'mode':        'radio',
            'delim':       ',',
            'index':       null,
            'disabled':    false,
            'focus':       void(0),
            'label':       void(0),
            'type':        void(0),
            'viewButton':  void(0),
            'viewOption':  void(0)
        },

        'initialize': function ns_models_select(attrs) {
            if (!attrs || !('options' in attrs)){
                throw "i::select: incorrect options";
            }

            this.indexedOption  = this.indexedOption.bind(this);
            this.getOptionLabel = this.getOptionLabel.bind(this);

            this.createIndex();
            this.setLabel();

            //attrs.options.length || this.set('disabled', true);
            //this.on('change:selected', this.selectedHandler);
            this.on('change:selected', this.setLabel);
            this.on('change:open',  this.openHandler);
            //this.reset();
            //this.set('selected', this.getSelected() );
        },

        'createIndex': function(){
            var index   = [],
                options = this.get('options');

            options.forEach(
                function(option){
                    index.push(
                        {id: option.cid}
                    );
                }
            );

            this.set('index', new ns.models.selectIndex(index) );
            this.listenTo(
                this.get('index'),
                'change:selected',
                this.setSelected
            );
        },

        'setLabel': function(){
            var label = this.get('placeholder'),
                selected = this.get('selected'),
                type, isCheck;

            if(selected){
                label = selected.map(
                    this.getOptionLabel
                );
                type  = this.get('type');
                isCheck = this.isCheck();

                console.log('setLabel', label);
            }

            this.set('label', label);
        },

        'indexHandler': function(){
            console.log('indexHandler', this, arguments);
        },

        'openHandler': function(select, value){
            this.set('focus', void(0));
        },

        'selectedHandler': function(select, value){
            var type = this.get('type'),
                isCheck = this.isCheck(),
                placeholder = this.get('placeholder'),
                label = placeholder;

            if(value){
                if(value.length!==0){
                    if(type==='string' || type==='array'){
                        label = value;
                    } else if(type==='collection'){
                        if(isCheck){
                            label = value
                                    .map(this.getOptionLabel.bind(this))
                                    .join(this.get("delim"));
                        } else {
                            label = value.has('label') ? value.get('label') : value.cid;
                        }
                    }
                }
            }
            if(isCheck){
                this.set('checked', (label !== placeholder));
            }
            this.set('label', label);
        },

        'toggleOpen': function(open){
            this.set(
                'open',
                open===(void 0) ? !this.get('open') : !!open
            );
        },

        'selectFocused': function(){
            /*if(this.get("focus")){
                this.selectByCid(
                    this.get("focus")
                );
            }*/
            if (!this.isCheck()) {
                this.toggleOpen(false);
            }
        },

        'select': function(value){
            if (!value){
                throw "i::select: incorrect value";
            }
            var select  = this,
                type    = this.get('type'),
                options = this.get('options'),
                isCheck = this.isCheck(),
                cid,
                selected;

            if(typeof value === 'string'){
                selected = options.where({label: value});
            } else if(value instanceof Backbone.Model){
                select.selectByCid(value.cid);
                return this;
            } else {
                throw "i::select: incorrect value type";
            }

            if(selected.length){
                selected.forEach(
                    function(option){
                        select.selectByCid(option.cid);
                    }
                )
            } else {
                this.reset();
            }
            return this;
        },

        /*'getSelected': function(_type){
            var type     = _type || this.get("type"),
                index    = this.get("index"),
                options  = this.get("options"),
                isCheck  = this.isCheck(),
                selected = [],
                option,
                id;

            for(id in index){
                if(index[id]){
                    option = options.get({cid: id});
                    selected.push(option);
                }
            }

            if (type === 'string') {
                selected = selected.join(this.get("delim"));
            } else {
                if(!isCheck){
                    selected = selected.length ? selected[0] : null;
                }
            }

            return selected;
        },*/

        'getOptionLabel': function(option){
            var label;
            if (option.has('label')){
                label = option.get('label');
            } else if (option.has('value')){
                label = option.get('value');
            } else {
                label = option.cid;
            }
            return label;
        },

        'selectByCid': function(cid){
            if (typeof cid !== 'string'){
                throw "i::select: incorrect cid";
            }

            var index    = this.get('index'),
                isCheck  = this.isCheck(),
                item     = index.get(cid),
                selected;

            if (!isCheck) {
                if((selected = index.findWhere({'selected': true}))){
                    selected.set('selected', false);
                }
            }

            item.set('selected', !item.get('selected'));

        },

        'indexedOption': function(item){
            return this
                    .get('options')
                    .get(item.get('id'));
        },

        'setSelected': function(){

            var result = this
                    .get('index')
                    .where({'selected': true})
                    .map(this.indexedOption);

            return this.set(
                'selected',
                result.length ? result : null
            );

        },

        'getOptionValue': function(option){
            var type = this.get('type');
            if(type==='string' || type==='array'){
                if(option.has('label')){
                    return option.get('label');
                } else if(option.has('value')){
                    return option.get('value');
                } else {
                    return option.toJSON();
                }
            } else {
                return option;
            }
        },

        'isCheckedOption': function(option){
            var index = this.get('index'),
                key = option.cid;
            return key in index ? index[key]===true : false;
        },

        'isCheck': function() {
            return this.get('mode') === 'check';
        },
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every
        'focusPrev': function() {
            var current  = this.get('focus'),
                options  = this.get('options'),
                filtered = this.get('filtered'),
                prev     = false;
            if(current){
                options.every(
                    function(option){
                        if(filtered.lastIndexOf(option.cid) > -1){
                            return true;
                        }

                        if(option.cid === current){
                            this.set('focus', prev);
                            return false;
                        } else {
                            prev = option.cid;
                        }

                        return true;
                    },
                    this
                );
            }
            return prev;
        },
        'focusNext': function() {
            var current  = this.get('focus'),
                options  = this.get('options'),
                filtered = this.get('filtered'),
                next     = false;
            if(current){
                options.every(
                    function(option){
                        if(option.cid in filtered){
                            return true;
                        }

                        if(next){
                            this.set('focus', option.cid);
                            return false;
                        } else if(option.cid === current){
                            next = true;
                        }
                        return true;
                    },
                    this
                );
            } else {
                options.every(
                    function(option){
                        if(filtered.lastIndexOf(option.cid) > -1){
                            return true;
                        } else {
                            next = option.cid;
                            return false;
                        }
                    },
                    this
                );
                this.set('focus', next);
            }
            return true;
        }
    }
);
