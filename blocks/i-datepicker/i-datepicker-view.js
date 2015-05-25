ns.views.datepicker = Backbone.View.extend({
    'block': 'i-datepicker',
    'initialize': function(options) {
        this.select = options.select;
        this.options = options.options
        this.$popup = this.$('.i-popup');
        this.render();
        this.listenTo(
            this.select,
            'change:selected',
            this.proxySelected
        );
    },
    'proxySelected': function(select, selected) {
        selected && this.options.state.set(
            'selected',
            selected
        );
    },
    'render': function() {
        this.$popup.addClass(this.block + '__popup');
        this.$popup.find('.i-select__options-list')
                   .addClass(this.block + '__month');
        this.$popup.prepend(
            $C.tpl[this.block + '__week']()
        );
        this.$form = $('<div>').addClass(this.block + '__form')
                               .prependTo(this.$popup);
        this.listenTo(
            this.options,
            'sync',
            this.renderForm
        );
    },
    'renderForm': function() {
        //this.select.select(this.options.state.get('selected'));
        this.$form.empty();
        $C.tpl[this.block + '__form'].call(
            this.$form[0],
            this.options.state
        );
    }
});