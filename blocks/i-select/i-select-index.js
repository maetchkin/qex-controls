
ns.models.selectIndexItem = Backbone.Model.extend(
    {
        'defaults': {
            'focus':    false,
            'selected': false,
            'show':     true
        }
    }
);

ns.models.selectIndex = Backbone.Collection.extend(
    {
        'model': ns.models.selectIndexItem,
        /*'initialize': function () {
            //console.log('ns.models.selectIndex', this);
        }*/
    }
);