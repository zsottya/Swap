(function(window, document, $) {
        
	this.Swap = function() 
	{
		this.options = {};
        this.swaps = [];

        var defaults = {
            selector: null,
            onReady: null,
            onRefresh: null,
            centerOnStart: true, //Indításnál középre rendeződjön-e automatán a húzófelület
            dragHandlerImage: './app/handler.png', //A húzó felület képe 
            dragHandlerWidth: 50, //A húzófelület szélessége 
            centerLineBackgroundColor: '#000', //A húzófelület háttérszíne
            centerLineWidth: 1, //A középső elválasztó vonal szélessége
            onlyOne: true, //A többi swap-ot elrejti ebben a swap beállításban (azaz ha a selector pl: .swaplist és pl 5 ilyen div van akkor csak az első lesz látható)
            autoCenterInParent: true //A swap ha headerrel rendelkezik, akkor a header magasságával újraméreteződik, ezzel lehet automatán az őt befoglaló szülő elemen belül centerbe helyezni
        };

        if (arguments[0] && typeof arguments[0] === "object") {
	     	this.options = extend(defaults, arguments[0]);
	    }

        init.call(this);
    }
    
	Swap.prototype.refresh = function() 
    {
        if (this.swaps && this.swaps.length) {
            this.swaps.each(function() {
                doSwapCalculations.call(this, this.options, false);
            });
        }
    }

    function init() 
    {
        if (this.options.selector != null) {
            var o = this.options;

            this.swaps = $(o.selector);

            var self = this;
            var swapsLength = this.swaps.length;

            if (swapsLength) {
                this.swaps.each(function(i,el) {
                    this.options = o;

                    if ((createMarkup.call(this, o, i+1, swapsLength)) !== false) {
                        addDragHandler.call(this, o);
                        doSwapCalculations.call(this, o, true);
                        setEvents.call(this, o);
                        
                        if (o.centerOnStart === true) {
                            goToPosition.call(this, o, null);
                        }                        
                    }
                });

                if (typeof(o.onReady) === 'function') {
                    o.onReady.call(this, this.swaps);
                }

                var self = this;
                self.swapTimer = null;
                $(window).on('resize', function() {
                    if (self.swapTimer) {
                        clearTimeout(self.swapTimer);
                    }

                    self.swapTimer = setTimeout(function() {
                        self.swaps.each(function(i,el) {
                            doSwapCalculations.call(this, o, false);
                        });
                    }, 200);
                });
            }
        }
    }

    function createMarkup(o, currentIndex, swapCount) 
    {
        var self = $(this);
        var imgs = self.children('img');
        var len = imgs.length;

        if (len < 2) {
            console.log('Swap error: min. 2 image required!');
            return false;
        }
        
        var linksLeft = '';
        var linksRight = '';
        var html = '';
        var title = '';
        var src = '';

        imgs.each(function(i,e) {
            title = $(this).attr('title');
            src = $(this).attr('src');

            alt = $.trim( String($(this).attr('alt')) );
            alt = alt == 'undefined' ? '' : alt;
            
            if (len > 2) {
                linksLeft += '<a class="sw-image-changer '+(i==0?'active' : (i==1?'disabled':''))+'" href="'+src+'">'+title+'</a>';
                linksRight += '<a class="sw-image-changer '+(i==0?'disabled' : (i==1?'active':''))+'" href="'+src+'">'+title+'</a>';
            }

            if (i==0) {
                alt = alt != '' ? '<span class="sw-text sw-after-text">'+alt+'</span>' : '';
                html += '<div style="z-index:2" class="sw-image"><img class="sw-after" src="'+src+'">'+alt+'</div>';
            }

            if (i==1) {
                alt = alt != '' ? '<span class="sw-text sw-before-text">'+alt+'</span>' : '';
                html += '<div style="z-index:1" class="sw-image"><img class="sw-before" src="'+src+'">'+alt+'</div>';
            }
        });
        
        var tpl = '<div class="sw-header"><div class="sw-left">'+linksLeft+'</div><div class="sw-right">'+linksRight+'</div><div style="clear:both"></div></div><div class="swap">'+html+'</div>';

        self.html( tpl );
        self.show();

        if (len < 3) {
            self.find('.sw-header').height(0).hide();
        }

        if (o.onlyOne && currentIndex > 1) {
            self.addClass('hidden');
        }

        return true;
    }

    function doSwapCalculations(o, thisIsTheFirstCall) 
    {
        var self = $(this);
        var swapImages = self.find('img.sw-before, img.sw-after');
        var dragHandlerPosition = self.data('drag-handler-position') || 1;

        if (typeof(o.onRefresh) === 'function') {
            o.onRefresh.call(this, dragHandlerPosition);
        }

        if (thisIsTheFirstCall) {            
            self.css({ overflow: 'hidden' });
            
            self.find('*').each(function() {
                $(this).css({
                    '-webkit-touch-callout': 'none',
                    '-webkit-user-select': 'none',
                    '-khtml-user-select': 'none',
                    '-moz-user-select': 'none',
                    '-ms-user-select': 'none',
                    'user-select': 'none'
                });
            });
        }

        var selfWidth = self.width();
        var selfHeight = self.height();
        var swHeader = self.find('.sw-header');
        var headerHeight = 0;

        if (swHeader.length > 0 && swHeader.height() > 0) {
            var ratio = selfWidth / selfHeight;

            headerHeight = swHeader.outerHeight(true);

            selfHeight -= headerHeight;
            selfWidth = selfHeight * ratio;

            self.width( selfWidth );

            if (o.autoCenterInParent) {
                self.css({
                    left: '50%',
                    marginLeft: '-'+(selfWidth / 2)+'px'
                })
            }
        }

        if (this.dragHandler) {
            this.dragHandler.css({
                top: headerHeight,
                left: ((selfWidth * dragHandlerPosition) - (o.dragHandlerWidth / 2) - (o.centerLineWidth / 2)),
                height: selfHeight
            });

            this.dragHandler.find('span').height(selfHeight);

            self.data('header-height', headerHeight);
        }

        swapImages
            .width( selfWidth )
            .height( selfHeight )
            .css({ position: 'relative', left: 0, top: 0 });

        self.find('img.sw-after')
            .parent()
            .width( selfWidth * dragHandlerPosition  )
            .height( selfHeight )
            .css({ overflow: 'hidden', position: 'absolute', left: 0, top: headerHeight });
            
        self.find('img.sw-before')
            .parent()
            .width( selfWidth)
            .height( selfHeight )
            .css({ overflow: 'hidden', position: 'absolute', left: 0, top: headerHeight });

        if (self.find('.sw-text').length > 0) {
            self.find('.sw-text').each(function() {
                try {
                    var padding = parseInt($(this).css('padding-left')) * 2;
                    $(this).width( selfWidth - padding );
                } catch(err) {
                    $(this).width( selfWidth );
                }
            });
        }
    }

    function addDragHandler(o) 
    {
        var self = $(this);
        var swapHeight = self.height();
        var handler = $('<div/>', { 'class': 'dragHandler' }).prependTo( self.find('.swap')[0] );

        this.dragHandler = handler;
        
        handler
            .html('<span class="dragHandlerArrows"></span><span class="dragHandlerCenter"></span>')
            .width( o.dragHandlerWidth )
            .height( swapHeight )
            .css({
                position: 'absolute',
                zIndex: 20,
                right: '-'+(o.dragHandlerWidth / 2)+'px',
                top: 0
            })

        handler.find('.dragHandlerCenter').css({
            width: o.centerLineWidth,
            height: swapHeight,
            position: 'absolute',
            zIndex: 7,
            right: 0,
            top: 0,
            backgroundColor: o.centerLineBackgroundColor,
            left: (o.dragHandlerWidth / 2)+'px'
        });

        handler.find('.dragHandlerArrows').css({            
            background: 'url('+o.dragHandlerImage+') no-repeat scroll center center transparent',
            backgroundSize: 'contain',
            width: o.dragHandlerWidth,
            height: swapHeight,
            position: 'absolute',
            top: 0     
        });
        
        handler.data('swap', self);
        handler.data('options', o);
        handler.draggable( { drag:dragEvent, stop:dragEvent });
    }

    function dragEvent(e, ui)
    {
        var self = $(this);
        var o = self.data('options');
        var swap = self.data('swap');
        var swapHeaderheight = swap.data('header-height') || 0;

        if (ui.position.left < -(o.dragHandlerWidth / 2)) {
            ui.position.left = -(o.dragHandlerWidth / 2);
        }

        if (ui.position.left > $(swap).width() - (o.dragHandlerWidth / 2) - (o.centerLineWidth / 2)) {
            ui.position.left = $(swap).width() - (o.dragHandlerWidth / 2) - (o.centerLineWidth / 2);
        }

        if (ui.position.top != swapHeaderheight) {
            ui.position.top = swapHeaderheight;
        }

        var size = ui.position.left + (o.dragHandlerWidth / 2);
        self.parent().find('img.sw-after').parent().width( size );
       
        var percent = size / swap.width();
        swap.data('drag-handler-position', percent);    
    } 

    function goToPosition(o, value) 
    {
        var triggerLeave = value == null;
        var dragHandler = this.dragHandler ? this.dragHandler : null;
        var self = $(this);
        var selfWidth = self.width();

        value = value != null ? value : selfWidth / 2;

        if (dragHandler) {
            dragHandler.animate({ left: value - (o.dragHandlerWidth / 2) }, { queue: false, duration: 800 });
        }

        self
            .find('img.sw-after')
            .parent()
            .animate({ 
                width: value+'px' 
            }, { 
                queue: false, 
                duration: 800, 
                complete: function() {
                    try {
                        $(':hover').each(function() {
                            if ($(this).hasClass('swap-container')) {
                                triggerLeave = false;
                                return;
                            }
                        });
                    } catch(err) {}


                    if (triggerLeave && dragHandler) {
                        dragHandler.trigger('mouseleave');
                    } 

                    self.data('drag-handler-position', value / selfWidth);
                } 
            });
    }

    function setEvents(o) 
    {
        var self = this;

        $('img', this).on('dragstart', function(e) {
            e.preventDefault();
        });

        this.dragHandler.on('click', function() {
            self.dragHandler.animate({ opacity: 1 }, { queue: false, duration: 100 });
        });

        $(this)
            .on('click', function(e) {
                var target = $(e.target);

                if (target.parents('.sw-header').length === 0) {
                    var value = e.pageX - $(this).offset().left;
                    goToPosition.call(self, o, value);
                }
            })
            .on('mouseenter', function() {
                if (self.dragHandler) {
                    self.dragHandler.animate({ opacity: 1 }, { queue: false, duration: 300 });
                }
            })
            .on('mouseleave', function(e) {
                if (self.dragHandler) {
                    self.dragHandler.animate({ opacity: 0.1 }, { queue: false, duration: 300 });
                }
            });

        //Fejléc váltó link
        $('.sw-image-changer', this).on('click', function(e) {
            e.preventDefault();

            var self = $(this);

            if (!self.hasClass('active') && !self.hasClass('disabled')) {
                var swap = self.parents('.swap-container:first');
                var index = self.index();
                var parentIndex = self.parent().index();

                var oppositeParentIndex = parentIndex === 0 ? 1 : 0;
                var oppositeContainer = swap.find('.sw-header > div:eq('+oppositeParentIndex+')');
                var opposite = oppositeContainer.find('a:eq('+index+')');

                oppositeContainer.find('a').removeClass('disabled');
                opposite.addClass('disabled');

                self.parent().find('a').removeClass('active');
                self.addClass('active');

                var img = swap.find('.sw-image:eq('+parentIndex+') > img').eq(0);
                img.attr('src', self.attr('href'));
            }
        });
    }

	// Objektum összemosás
	function extend(source, properties) 
	{
		var property;
		for (property in properties) {
			if (properties.hasOwnProperty(property)) {
				source[property] = properties[property];
			}
		}
		return source;
	}

}(window, document, jQuery));