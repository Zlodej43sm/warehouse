jQuery(function($){

  var $body = $('body');

  window.pushNoty = function(type, msg, killer){
    var n = noty({
      text        : msg,
      type        : type,
      dismissQueue: true,
      layout      : 'topRight',
      theme       : 'defaultTheme',
      maxVisible  : 5,
      modal       : false,
      killer      : !!killer,
      animation   : {
        open : 'animated fadeInDown',
        close: 'animated fadeOutUp',
      },
      timeout: 10000
    });
  };

  if (window.NOTY_MSG && Object.keys(window.NOTY_MSG).length) {
    $.each(window.NOTY_MSG, function(type, messages){
      if (messages.length) {
        $.each(messages, function(i, msg){
          pushNoty(type, msg);
        });
      }
    });
  }

  // For the facebook url error
  if (window.location.hash && window.location.hash == '#_=_') {
    if (window.history && history.pushState) {
      window.history.pushState("", document.title, window.location.pathname);
    } else {
      // Prevent scrolling by storing the page's current scroll offset
      var scroll = {
        top: document.body.scrollTop,
        left: document.body.scrollLeft
      };
      window.location.hash = '';
      // Restore the scroll offset, should be flicker free
      document.body.scrollTop = scroll.top;
      document.body.scrollLeft = scroll.left;
    }
  }

  // io.socket.on('connect', function(){
  //   io.socket.get('/user', {}, function(users){
  //     if ($.type(users) == "string") {
  //       return console.error(users);
  //     }
  //     console.log(users)
  //   });
  //   io.socket.on('user', function(msg){
  //     console.log('Got message:', msg)
  //   });
  // });

  // Bootstrap modal actions
  $body.on('shown.bs.modal', function(e){
    var modal = $(e.target).data('bs.modal');
    if (!modal.$form) {
      modal.$form = modal.$dialog.find('form').qForm({remote: true});
      modal.$form.on('success.qf', function(){ modal.hide() });
    }
    modal.$form.qForm('focusForm');
  }).on('hidden.bs.modal', function(e){
    var modal = $(e.target).data('bs.modal');
    if (modal) modal.$form.qForm('reset');
  });

  // Bootstrap modal remote (ajax)
  var callRemoteModal = function (url) {
    $.get(url, function(res){
      var $modal = $(res).appendTo('body')

      // TODO:
      $("input.fileinput", $modal).bootstrapFileInput();
      $("[data-toggle=colorpicker]", $modal).colorpicker({
        format: 'hex'
      });

      $modal.modal();
      $body.trigger('loaded.bs.modal', [$modal]);
      $modal.on('hidden.bs.modal', function(){
        $modal.remove();
      });
    });
  };
  $('[data-toggle="modal"]').on("click", function(e){
    var $control = $(this)
      , url      = $control.attr('href') || $control.data('target');
    if (!/^(https?|\/\/?)/.test(url)) return;
    e.preventDefault();
    e.stopPropagation();
    callRemoteModal(url);
  });

  // Init DataTable Grid
  if ($.fn.dtGrid) {
    $('.datatable').not('.dt-manual-init').dtGrid();
  }

  // Bootstrap tab actions
  $('.tab-controls, .nav-tabs').each(function(){
    var $holder  = $(this)
      , cacheKey = this.id + window.location.pathname
      , activeTab;

    $holder.on("click", "a", function(e){
      var $control = $(this);
      e.preventDefault();
      $control.tab("show").addClass('active').siblings().removeClass('active');
      localStorage.setItem(cacheKey, $control.attr('href'));
    });

    if (localStorage.getItem(cacheKey))
      $holder.find('a[href="'+ localStorage.getItem(cacheKey) +'"]').trigger('click')
    else $holder.find('a:first').trigger('click')
  });

  // Bootstrap tooltip
  if ($.fn.tooltip) {
    $body.tooltip({
      selector  :'[title]:not(.fileinput)',
      container :"body",
      trigger   : "hover"
    });
  }

  // Bootstrap file input
  if (typeof $.fn.bootstrapFileInput == 'function') {
    $("input.fileinput").bootstrapFileInput();
  }

  // Bootstrap colorpicker
  if (typeof $.fn.colorpicker == 'function') {
    $("[data-toggle=colorpicker]").colorpicker({
      format: 'hex'
    });
  }

  // Init Forms validation ...
  $('form.betterform').qForm({ remote: false });

});

window.downloadFile = function (url) {
  var ua       = navigator.userAgent.toLowerCase()
    , isChrome = ua.indexOf('chrome') > -1
    , isSafari = ua.indexOf('safari') > -1;

  //iOS devices do not support downloading. We have to inform user about this.
  if (/(iP)/g.test(navigator.userAgent)) {
    alert('Your device does not support files downloading. Please try again in desktop browser.');
    return false;
  }

  //If in Chrome or Safari - download via virtual link click
  if (window.downloadFile.isChrome || window.downloadFile.isSafari) {
    //Creating new link node.
    var link = document.createElement('a');
    link.href = url;

    if (link.download !== undefined) {
      //Set HTML5 download attribute. This will prevent file from opening if supported.
      // var fileName = url.substring(url.lastIndexOf('/') + 1, url.length);
      link.download = '';
    }

    //Dispatching click event.
    if (document.createEvent) {
      var e = document.createEvent('MouseEvents');
      e.initEvent('click', true, true);
      link.dispatchEvent(e);
      return true;
    }
  }

  // Force file download (whether supported by server).
  /*if (url.indexOf('?') === -1) {
    url += '?download';
  }*/

  window.open(url, '_self');
  return true;
}