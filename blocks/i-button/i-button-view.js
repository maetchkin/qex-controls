var changed = {},
    events = {
            'keydown': 'keyPressed',
            'keyup': 'keyAction',
            'mousedown': 'pressed',
            'mouseup': 'action',
            'mouseout': 'mouseout',
            'mouseover': 'mouseover',
            'click': 'stop',
            'focus': 'onfocus',
            'blur':  'onblur'
     };
ns.views.button = Backbone.View.extend(
    {
        'block': 'i-button',

        'events': {
            'mouseover': 'asyncInit',
            'focus': 'onfocus',
            'blur':  'onblur'
        },

        'actions': {
            'init':     ['setClass'],
            'action':   ['setClass'],
            'checked':  ['setClass'],
            'disabled': ['setClass', 'disable'],
            'loading':  ['setClass', 'disable'],
            'label':    ['renderFace'],
            'pseudofocus': ['setClass']
        },

        'initialize': function(options) {
            for(var k in this.actions){
                this.setActions(k);
            }
            this.listenTo(
                this.model,
                'destroy',
                this.remove
            );
            this.listenTo(
                this.model,
                'asyncInit',
                this.asyncInit
            );
            this.listenTo(
                this.model,
                'change',
                this.onChange
            );
            this.listenTo(
                this.model,
                'update',
                this.renderFace
            );
        },

        'asyncInit': function() {
            if( !this.model.get('init') ){
                this.delegateEvents(events);
                this.model.set('init', true);
            }
        },

        'onfocus': function(){
            this.$el.addClass('i-button__pseudofocus');
            this.asyncInit();
        },
        'onblur': function(){
            this.$el.removeClass('i-button__pseudofocus');
        },

        'setActions': function(modifier) {
            var actions = this.actions[modifier],
                invokeAction = function(model, value) {
                    /* closure: modifier, actions */
                    for (var i = 0, l = actions.length; i < l; i++) {
                        this[actions[i]](modifier, value);
                    }
                };
            if (modifier in changed) {
                invokeAction.call(this, this.model, this.model.get(modifier));
            }
            this.listenTo(
                this.model,
                'change:' + modifier,
                invokeAction
            );
        },

        'stop': function(e) {
            if (this.shouldIgnore(e)) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
        },

        'shouldIgnore': function(e) {
            return e && (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey || e.button > 0);
        },

        'pressed': function(e) {
            if (this.shouldIgnore(e)) {
                return;
            }
            e && this.stop(e);
            if (!this.model.isDisabled()) {
                this.setClass('pressed', true);
            }
        },

        'keyPressed': function(e) {
            switch (e.which) {
                case ns.keys.enter:
                    this.enterPressed || this.pressed(e);
                    this.enterPressed = true;
                    break;
                case ns.keys.space:
                    this.spacePressed || this.pressed(e);
                    this.spacePressed = true;
                    break;
            }
        },

        'action': function(e) {
            var proxied = e.clientX > 0;
            this.setClass('pressed', false);
            if (this.shouldIgnore(e)) {
                return;
            }
            e && this.stop(e);
            if (!this.model.isDisabled()) {
                this.model.trigger(
                    'action',
                    this.model,
                    proxied
                );
            }
        },

        'keyAction': function(e) {
            switch (e.which) {
                case ns.keys.enter:
                    this.action(e);
                    this.enterPressed = false;
                    break;
                case ns.keys.space:
                    this.action(e);
                    this.spacePressed = false;
                    break;
            }
        },

        'mouseout': function(e) {
            this.setClass('hover', false);// async delay
            !this.enterPressed && !this.spacePressed && this.setClass('pressed', false);
        },

        'mouseover': function(e) {
            this.setClass('hover', true);// async delay
            !this.enterPressed && !this.spacePressed;
        },

        'setClass': function(modifier, value) {
            this.$el.toggleClass(this.block + '__' + modifier, !!value);
        },
        'disable': function(modifier, value) {
            if(this.model.isDisabled()){
                this.$el.attr('disabled', true);
                this.$el.attr('tabindex', '-1');
            } else {
                this.$el.removeAttr('disabled');
                this.$el.attr('tabindex', '0');
            }
        },
        'onChange': function() {
            Object.keys(
                this.model.changedAttributes()
            ).every(
                {}.hasOwnProperty.bind(
                    this.actions
                )
            ) || this.renderFace();
        },
        'renderFace': function() {
            var face = this.$('.i-button__face'),
                template = this.model.get('template') || 'i-button__label';
                face.empty();

            $C.tpl[template].call(
                face[0],
                this.model
            );
        }
    }
);
