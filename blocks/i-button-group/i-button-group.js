ns.views.buttongroup = Backbone.View.extend(
    {
        'block': 'i-button-group',
        'initialize': function(){

            this.checkSelected(
                this.model,
                this.model.get('selected')
            );

            this.listenTo(
                this.model.get('buttons'),
                'action',
                this.select
            );

            this.listenTo(
                this.model,
                'change:selected',
                this.checkSelected
            );

        },
        'select': function(button) {
            // select none if we're unchecking in radiocheck mode
            this.model.get('radiocheck') && button.get('checked') && (button = null);
            this.model.set('selected', button);
        },
        'checkSelected': function(model, selected) {
            var buttons = this.model.get('buttons'),
                button = buttons.get(selected);
            buttons.forEach(this.uncheck);
            button && button.set('checked', true);
        },
        'uncheck': function(button){
            button.set('checked', false)
        }
    }
);

ns.models.buttongroup = Backbone.Model.extend(
    {
        'defaults': {
            'buttons': [],
            'radiocheck': false,
            'selected': null
        }
    }
);
