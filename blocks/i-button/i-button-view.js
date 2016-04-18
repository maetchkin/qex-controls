var changed = {},
    events = {
            'keydown': 'keyPressed',
            'keyup': 'keyAction',
            'mousedown': 'pressed',
            'mouseup': 'action',
            'click': 'stop',
            'focus': 'onfocus',
            'blur':  'onblur'
     };
ns.views.button = Backbone.View.extend(
    {
        'block': 'i-button',

        'events': {
            'click': 'action'
        },

        'actions': {
            'action':   ['setClass'],
            'checked':  ['setClass'],
            'disabled': ['disable'],
            'loading':  ['setClass', 'disable'],
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
                'change',
                this.onChange
            );
            this.listenTo(
                this.model,
                'update',
                this.renderFace
            );
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
            e.preventDefault();
            e.stopPropagation();
        },

        'shouldIgnore': function(e) {
            return e && (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey || e.button > 0);
        },

        'action': function(e) {
            var proxied = e.clientX > 0;
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

        'setClass': function(modifier, value) {
            this.$el.toggleClass(this.block + '__' + modifier, !!value);
        },
        'disable': function(modifier, value) {
            if(this.model.isDisabled()){
                this.$el.attr('disabled', true);
            } else {
                this.$el.removeAttr('disabled');
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
