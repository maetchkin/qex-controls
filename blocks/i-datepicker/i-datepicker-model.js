ns.models.date = Backbone.Model.extend({
    'initialize': function(params) {
        var date = params.date;
        if (params.type === 'from') {
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);
        } else if (params.type === 'to') {
            date.setHours(23);
            date.setMinutes(59);
            date.setSeconds(59);
            date.setMilliseconds(999);
        }
        this.set(
            'label',
            [
                (100 + date.getDate() + '').slice(-2),
                (101 + date.getMonth() + '').slice(-2),
                date.getFullYear()
            ].join('.')
        );
    }
});

ns.models.datepicker = Backbone.Model.extend({
    'getDate': function() {
        return this.get('selected').get('date');
    }
})

ns.sets.month = Backbone.Collection.extend({
    'model': ns.models.date,
    'initialize': function(models) {
        var selected = models[0],
            date = selected.get('date');
        this.state = new ns.models.datepicker({
            'selected': selected,
            'year': date.getFullYear(),
            'month': date.getMonth()
        });
        window.setTimeout(
            this.setDays.bind(this),
            0
        );
        this.listenTo(
            this.state,
            'change:year change:month',
            this.setDays
        );
    },
    'setDays': function() {
        var date;
        this.reset();
        for (var day = 1; day <= 31; day++) {
            date = new Date(
                this.state.get('year'),
                this.state.get('month'),
                day
            );
            if (day === 1) {
                this.state.set(
                    {
                        'year': date.getFullYear(),
                        'month': date.getMonth()
                    },
                    {
                        'silent': true
                    }
                );
            }
            if (date.getMonth() !== this.state.get('month')) {
                break;
            }
            this.add(
                date.toDateString() === this.state.get('selected').get('date').toDateString() ?
                    this.state.get('selected') :
                    {
                        'date': date,
                        'type': this.state.get('selected').get('type')
                    }
            );
        }
        this.trigger('sync');
    }
});