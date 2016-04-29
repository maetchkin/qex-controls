ns.views.check = Backbone.View.extend({
    'block': 'i-check',
    'events': {
        'click': 'toggle'
    },
    'initialize': function(options) {
        this.button = options.button;
        this.listenTo(
            this.button,
            'action',
            this.toggle
        );
        this.listenTo(
            this.model,
            'change:on',
            this.setOn
        );
        this.listenTo(
            this.model,
            'change:disabled',
            this.setDisabled
        );
    },
    'toggle': function(e) {
        e.stopPropagation && e.stopPropagation();
        this.model.get('disabled') || this.model.set(
            'on',
            !this.model.get('on')
        );
    },
    'setOn': function(model, value) {
        this.$el.toggleClass(
            this.block + '_state_on',
            !!value
        )
        this.button.set(
            'checked',
            value
        );
    },
    'setDisabled': function(model, value) {
        this.$el.toggleClass(
            this.block + '_disabled',
            !!value
        )
        this.button.set(
            'disabled',
            value
        );
    }
});