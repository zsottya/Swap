var SWAPS;

function swapRefresher() 
{
	var self = $(this);

	var hasHeader = self.find('.sw-header').length > 0;
	var headerOuterHeight = hasHeader ? self.find('.sw-header').outerHeight(true) : 0;

	var maxWidth = $(window).width();
	var maxHeight = $(window).height();
	var swapHeight = maxHeight - 100 - headerOuterHeight;
	var swapWidth = swapHeight * (16/9);

	if (swapWidth > maxWidth) {
		swapWidth = maxWidth;
		swapHeight = swapWidth * (9/16);
	}

	self.css({
		left: '50%',
		top: '50%',
		width: swapWidth,
		height: swapHeight,
		marginLeft: '-'+(swapWidth / 2)+'px',
		marginTop: '-'+(swapHeight / 2)+'px'
	});
}

function showSwap(index) 
{
	$('.swap-container').attr('class','swap-container hidden');
	$('.swap-container:eq('+index+')').attr('class','swap-container');

	$('#title a').removeClass('active');
	$('#title a:eq('+index+')').addClass('active');

	SWAPS.refresh();
}

$(window).on('load', function() {

	SWAPS = new Swap({
		selector: '.swap-container',
		onRefresh: swapRefresher
	});

});
