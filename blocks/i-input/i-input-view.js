ns.views.input = Backbone.View.extend(
    {
        'actions': {
            'disabled':     'disable',
            'value':        'setValue',
            'placeholder':  'setPlaceholder'
        },
        'events': {
            'input': 'onInput',
            'click .i-input__clear': 'clear'
        },
        'initialize': function() {
            this.$input = this.$('.i-input__input');
            Object.keys(this.actions).forEach(
                this.listenToMods,
                this
            );
            this.listenTo(
                this.model,
                'focus',
                this.focus
            );
        },
        'focus': function(){
            this.$input.focus();
            if('setSelectionRange' in this.$input[0]){
                var length = this.$input.val().length;
                this.$input[0].setSelectionRange(length, length);
            }
        },
        'listenToMods': function(mod){
            this.listenTo(
                this.model,
                'change:' + mod,
                this[this.actions[mod]]
            );
        },
        'disable': function(model, value) {
            if (value !== false) {
                this.$el.addClass('i-input__disabled');
                this.$input.attr('disabled', 'disabled');
            } else {
                this.$el.removeClass('i-input__disabled');
                this.$input.removeAttr('disabled');
            }
        },
        'setPlaceholder': function(model, value){
            if (value) {
                this.$input.get(0).setAttribute(
                    'placeholder',
                    value
                );
            } else {
                this.$input.get(0).removeAttribute(
                    'placeholder'
                );
            }

        },
        'setValue': function(model, value) {
            value = value + '';
            this.$input.val(value);
            this.$el.toggleClass('i-input__empty', !(value.length > 0));
        },
        'onInput': function() {
            if (this.input) {
                clearTimeout(this.input);
                delete this.input;
            }
            this.input = setTimeout(
                this.readInput,
                this.model.get('debounce'),
                this
            );
        },
        'readInput': function(input){
            input.model.set('value', input.$input.val());
        },
        'clear': function() {
            this.$input.val('');
            this.$input.focus();
            this.$input.trigger('input');
        }
    }
);
