var offsetDim = {
    'height': 'offsetHeight',
    'width': 'offsetWidth'
};

//remove the popup if the owner is removed by jQuery/Zepto
$.cleanData              ? 
    // jQuery
    $.cleanData = (function (origFn) {
        return function(elems) {
            removePopups($(elems));
            return origFn.apply(this, arguments);     
        };
    })($.cleanData)      :
    // Zepto
    ['empty', 'remove'].forEach(
        function(method) {
            $.fn[method] = (function (origFn) {
                return function() {
                    var elems = this.find('*');
                    method === 'remove' && (elems = elems.add(this));
                    removePopups(elems);
                    return origFn.apply(this, arguments);     
                };
            })($.fn[method])
        }
    );

function removePopups(elems) {
    elems.each(
        function() {
            var popup = this['__popup'];
            popup && popup.trigger && popup.trigger('destroy');
        }
    );
}



ns.views.popup = Backbone.View.extend({
    'initialize': function() {
        var mode = this.model.get('mode');
        this.$owner = $(this.model.get('owner'));
        this.show = this.show.bind(this);
        this.setShowTimeout = this.setShowTimeout.bind(this);
        this.clearShowTimeout = this.clearShowTimeout.bind(this);
        mode === 'click' && this.listenToOwner(mode);
        mode === 'hover' && this.showOnHover();
    },
    'styleTail': function() {
        var params = this.model.attributes,
            popupAlignDim = this.el[offsetDim[params.alignDim]],
            halfWidth = Math.min(
                params.tailWidth,
                popupAlignDim
            )/2,
            height = params.tailHeight,
            hypotenuse = Math.sqrt(halfWidth * halfWidth + height * height),
            initial = 2 * Math.ceil(halfWidth * height / hypotenuse),
            kh = Math.SQRT2 * height / initial,
            kw = Math.SQRT2 * halfWidth / initial,
            alignOffset = params.alignOffset,
            tailOffset = params.tailOffset,
            ownerAlignDim = this.$owner[0][offsetDim[params.alignDim]],
            popupOffsets = {
                'start': alignOffset,
                'center': ownerAlignDim/2 
                    - popupAlignDim/2 + alignOffset,
                'end': ownerAlignDim
                    - popupAlignDim - alignOffset
            },
            tailOffsets = {
                'start': tailOffset,
                'center': ownerAlignDim/2 + tailOffset,
                'end': ownerAlignDim - tailOffset
            },
            tailPosition = tailOffsets[params.tailAlign] -
                popupOffsets[params.align],
            angles = {
               'top': -135,
               'right': -45,
               'bottom': 45,
               'left': 135    
            },
            tailStyle = {
                'height': initial,
                'width': initial,
                'transform': 'scale(' + kw + ', ' + kh +
                    ') rotate(' + angles[params.side] + 'deg)'
            };
        tailPosition < halfWidth && (tailPosition = halfWidth);
        tailPosition > popupAlignDim - halfWidth &&
            (tailPosition > popupAlignDim - halfWidth);
        tailStyle[params.opposite] = -initial/2;
        tailStyle[params.alignStart] = tailPosition - initial/2;
        tailStyle[params.alignEnd] = 'auto',
        tailStyle[params.side] = 'auto',
        this.$('.i-popup__tail').css(tailStyle);
    },
    'position': function() {
        this.model.get('adaptive') && this.chooseSide();
        this.setLocation();
    },

    'chooseSide': function() {
        var params = this.model.attributes,
            rect = params.owner.getBoundingClientRect(),
            popupHeight = this.el.offsetHeight,
            popupWidth = this.el.offsetWidth,
            sideOffset = params.sideOffset +
                (params.tail && params.tailHeight),
            offsets = {
                'top': rect.top - popupHeight - sideOffset,
                'right': window.innerWidth - rect.right
                    - popupWidth - sideOffset,
                'bottom': window.innerHeight - rect.bottom
                    - popupHeight - sideOffset,
                'left': rect.left - popupWidth - sideOffset
            },
            sides = this.model.get('adaptive').split(' '),
            maxOffset = -Infinity,
            i = 0,
            l = sides.length,
            offset,
            side;
        for (; i < l; i++) {
            offset = offsets[sides[i]];
            if (offset >= 0 ) {
                this.model.set('side', sides[i]);
                return;
            }
            if (offset > maxOffset) {
                maxOffset = offset;
                side = sides[i];
            }
        }
        this.model.set('side', side);
    },
    'setLocation': function() {
        if (!this.$el.parent()[0]) {
            return;
        }

        var params = this.model.attributes,
            ownerRect = params.owner.getBoundingClientRect(),
            parentRect = this.$el.parent()[0].getBoundingClientRect(),
            baseSideOffset = ownerRect[params.side]
                - parentRect[params.sideStart],
            baseAlignStartOffset = ownerRect[params.alignStart]
                - parentRect[params.alignStart],
            baseAlignEndOffset = ownerRect[params.alignEnd]
                - parentRect[params.alignStart],
            baseAlignCenterOffset =
                (baseAlignStartOffset + baseAlignEndOffset) / 2,
            sideOffset = params.sideOffset +
                (params.tail && params.tailHeight),
            alignOffset = params.alignOffset,
            popupAlignDim = this.el[offsetDim[params.alignDim]],
            popupSideDim = this.el[offsetDim[params.sideDim]],
            alignStyles = {
                'start': baseAlignStartOffset + alignOffset,
                'center': baseAlignCenterOffset + alignOffset - popupAlignDim/2,
                'end': baseAlignEndOffset - alignOffset - popupAlignDim
            },
            styles = {};
        styles[params.alignStart] = alignStyles[params.align];
        styles[params.sideStart] = 
            params.side === params.sideStart ?
                // top or left 
                baseSideOffset - popupSideDim - sideOffset :
                // bottom or right
                baseSideOffset + sideOffset;
        this.$el.css(styles);
        params.tail && this.styleTail();
    },
    'show': function(e) {
        if (this.model.get('disabled')) {
            return;
        }
        this.isAppended || this.append();
        e && e.preventDefault();
        this.$el.show();
        this.$owner.parents().on('scroll resize', this.position);
        this.trigger('show');
        this.position();
    },
    'hide': function() {
        this.$owner.parents().off('scroll resize', this.position);
        this.$el.hide();
        this.trigger('hide');
        
    },
    'append': function() {
        var container = this.$owner.closest('.i-popup')[0] || document.body;
        this.model.getDimensions();
        this.position = this.position.bind(this);
        this.hide = this.hide.bind(this);
        this.setHideTimeout = this.setHideTimeout.bind(this);
        this.clearHideTimeout = this.clearHideTimeout.bind(this);
        this.autoclose = this.autoclose.bind(this);
        this.autodestroy = this.autodestroy.bind(this);
        
        this.model.get('autoclose') && this.once('show', this.addAutoclose);
        container.appendChild(this.el);
        this.isAppended = true;
        this.$owner[0]['__popup'] = this;
        this.on('destroy', this.autodestroy);
        this.$el.css('font-size', this.$owner.css('font-size'));
    },
    'autodestroy': function() {
        this.hide();
        this.remove();
    },
    'addAutoclose': function() {
        window.setTimeout(
            document.addEventListener.bind(
                document,
                'click',
                this.autoclose,
                true // use capture
            ),
            0
        );
        this.once('hide', this.removeAutoclose);
    },
    'removeAutoclose': function() {
        document.removeEventListener(
            'click',
            this.autoclose,
            true // use capture
        );
        this.once('show', this.addAutoclose);
    },
    'autoclose': function(e) {
        this.el.contains(e.target) || this.hide();
    },
    'listenToOwner': function(mode) {
        window.setTimeout(
            $.fn.on.bind(
                this.$owner,
                mode,
                this.show
            ),
            0
        );
        this.once(
            'show',
            function() {
                this.$owner.off(
                    mode,
                    this.show
                );
            }
        );
        this.once('hide', this.listenToOwner.bind(this, mode));
    },

    'showOnHover': function() {
        this.$owner.off('mouseleave', this.setHideTimeout);
        this.$el.off('mouseleave', this.setHideTimeout);
        this.$owner.off('mouseenter', this.clearHideTimeout);
        this.$el.off('mouseenter', this.clearHideTimeout);

        this.$owner.on('mouseenter', this.setShowTimeout);
        this.$owner.on('mouseleave', this.clearShowTimeout);

        this.once('show', this.hideOnUnhover);
    },
    'hideOnUnhover': function() {
        this.$owner.off('mouseenter', this.setShowTimeout);
        this.$owner.off('mouseleave', this.clearShowTimeout);

        this.$owner.on('mouseleave', this.setHideTimeout);
        this.$el.on('mouseleave', this.setHideTimeout);
        this.$owner.on('mouseenter', this.clearHideTimeout);
        this.$el.on('mouseenter', this.clearHideTimeout);

        this.once('hide', this.showOnHover);
    },
    'setHideTimeout': function() {
        this.hideTimeout = window.setTimeout(
            this.hide,
            this.model.get('hideDelay') || this.model.get('delay')
        );
    },
    'clearHideTimeout': function() {
        window.clearTimeout(this.hideTimeout);
    },
    'setShowTimeout': function() {
        this.showTimeout = window.setTimeout(
            this.show,
            this.model.get('showDelay') || this.model.get('delay')
        );
    },
    'clearShowTimeout': function() {
        window.clearTimeout(this.showTimeout);
    }
});