'use strict';

var block = 'i-select' + '__' + 'options-list' + '__' + 'item';

ns.views.selectOptions = Backbone.View.extend({
    'events': (function(){
                    var events = {};
                        events[ 'mousedown'                 ] = 'stop',
                        events[ 'mouseleave'                ] = 'optionFocus',
                        events[ 'mousemove .'+block         ] = 'optionFocus',
                        events[ 'mouseup   .'+block+'-focus'] = 'optionSelectPointer'
                    return events;
                })(),
    'initialize': function(options) {
        this.listenTo(
            this.model,
            'change:open',
            this.openHandler
        );
        this.listenTo(
            this.model,
            'change:focus',
            this.focusHandler
        );
        this.listenTo(
            this.model,
            'change:selected',
            this.setSelected
        );
        this.listenTo(
            this.model,
            'change:filtered',
            this.render
        );
        this.listenTo(
            this.model.get('options'),
            'reset sync',
            this.render
        );

    },
    'itemByCid': function(cid){
        return this.$el.find('.' + block + '[data-cid="'+cid+'"]');
    },
    'focusScroll': function(cid, dir){
        this.ignoreMouseFocus = true;
        this.itemByCid(cid).get(0).scrollIntoView(dir);
        setTimeout(
            function(list){
                delete list.ignoreMouseFocus;
            },
            100,
            this
        )
    },
    'focusHandler': function(model, cid){
        var prev   = model.previous("focus"),
            fclass = block + '-focus';

        if(prev){
            this.itemByCid(prev).removeClass(fclass)
        }

        if(cid){
            this.itemByCid(cid).addClass(fclass);
        }
    },
    'openHandler': function(model, open){
        if(open){
            this.render();
        } else {
            this.model.set('rendered', false);
        }
    },
    'render': function(){
        this.$el.html('');
        var top     = $C(this.el),
            select  = this.model,
            options = select.get('options'),
            index   = select.get('index'),
            filtered= select.get('filtered'),
            rendered= [];

        // concat.js
        options.forEach(
            function($option){

                if($option.cid in filtered){
                    return;
                }

                rendered.push($option.cid);

                var li = top.li({
                        'class':    block + ( !!index[$option.cid] ? ' '+block+'-selected' : '' ),
                        'data-cid': $option.cid
                    });

                select.get("viewOption")
                     ?
                        li.act(
                            function() {
                                $C.tpl[ select.get("viewOption") ].call(this, $option);
                            }
                        ).end()
                     :
                        li.text(
                            select.getOptionLabel($option)
                        ).end();
            }
        );
        this.model.get('allowEmpty') || this.model.set(
            'disabled',
            !options.length
        );
        top.end();
        select.set('rendered', rendered);
    },
    'stop': function(e){
        e.preventDefault();
        e.stopPropagation();
    },
    'optionSelectPointer': function(e){
        this.stop(e);
        this.model.selectFocused();
    },
    'optionFocus': function(e){
        if(!this.ignoreMouseFocus){
            this.model.set(
                'focus',
                e.currentTarget.getAttribute('data-cid')
            );
        }
    },
    'setSelected': function() {
        var index = this.model.get('index');
        this.$('.' + block)
            .removeClass(block + '-selected')
        Object.keys(index)
            .forEach(
                function(cid){
                    index[cid] && this
                        .$('.' + block + '[data-cid="' + cid + '"]')
                        .addClass(block + '-selected');
                },
                this
            );
    }
});