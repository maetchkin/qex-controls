ns.models.button = Backbone.Model.extend(
    {
        'defaults': {
            'size':     'M',
            'checked':  false,
            'disabled': false,
            'loading':  false,
            'template': void(0),
            'init': false
        },
        'isDisabled': function(){
            return this.get('disabled') || this.get('loading');
        }
    }
);
