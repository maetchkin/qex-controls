
ns.models.input = Backbone.Model.extend(
    {
        'defaults': {
            'placeholder': '',
            'size': 'M',
            'value': '',
            'disabled': false,
            'debounce': 0,
            'mode': 'input',
            'rows': 2
        }
    }
);