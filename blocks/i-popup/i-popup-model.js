ns.models.popup = Backbone.Model.extend(
    {   
        'initialize': function() {
            this.get('adaptive') === true &&
                this.set(
                    'adaptive',
                    'bottom left top right'
                );
            this.on(
                'change:side',
                this.getDimensions
            );
        },
        'getDimensions': function() {
            var side = this.get('side'),
                hor = side === 'left' || side === 'right',
                opposites = {
                    'top': 'bottom',
                    'bottom': 'top',
                    'left': 'right',
                    'right': 'left'
                };
            this.set({
                'sideDim'   : hor ? 'width'  : 'height',
                'alignDim'  : hor ? 'height' : 'width',
                'sideStart' : hor ? 'left'   : 'top',
                'alignStart': hor ? 'top'    : 'left',
                'opposite': opposites[side]
            });
            this.set(
                'sideEnd',
                opposites[this.get('sideStart')]
            );
            this.set(
                'alignEnd',
                opposites[this.get('alignStart')]
            );
        },
        'defaults': {
            'owner': document.body,
            'side': 'bottom',
            'adaptive': false,
            'align': 'start',
            'sideOffset': '.5em',
            'alignOffset': '1px',
            'tail': false,
            'tailWidth': '1em',
            'tailHeight': '.5em',
            'tailAlign': 'center',
            'tailOffset': '0px',
            'autoclose': true,
            'delay': 500
        }
    }
);