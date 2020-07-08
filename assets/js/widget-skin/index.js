Dropzone.autoDiscover = false;

$(function() {
  var img, margin;
  if($(".nav").length>0) {
    new Hammer($(".nav")[0], {
      domEvents: true
    });

    $(".nav").on("panstart", function (e) {
      img = $(".nav");
      margin = parseInt(img.css("margin-left"), 0);
    });

    $(".nav").on("pan", function (e) {
      if ($('html').width() < 840) {
        var panDelta = e.originalEvent.gesture.deltaX
        var delta = margin + panDelta;
        var additionalLefOffset = 10; // для более красивого сдвига
        if (delta >= -($(".nav").width()-$(window).width() + additionalLefOffset) && delta <= -0) {
          img.css({
            "margin-left": delta
          });
        }
      }
    });
  }

  $(window).on('resize', function (e) {
    if(($(window).width() >= 840)){
      if (!img){
        return;
      }
      img.css({
        "margin-left": 0
      });
    }
  });

  function replased (elem,replaseTo,back){
    if ($('html').width() < 840) {
      $(elem).prependTo( $( replaseTo ) );

    }else{
      $(elem).prependTo( $( back ) );
    }
  };
  replased('.prise','.about','.description');
  replased('.product-name','.about','.description');
  $( window ).resize(function() {
    replased('.prise','.about','.description');
    replased('.product-name','.about','.description');
  });
  $('.row.text input').keyup(function(event) {
    event.preventDefault();
    var filled = $(this).val();
    if (filled.length != 0) {
      $(this).siblings('label').addClass('filled');
      $(this).parent().siblings('label').addClass('filled');
    } else {
      $(this).siblings('label').removeClass('filled');
      $(this).parent().siblings('label').removeClass('filled');
    }
  });
  $(document).mouseup(function (e){ // событие клика по веб-документу
    var div = $(".tooltip");
    var opener=$('.tooltip-opener')// тут указываем ID элемента
    if (!div.is(e.target) // если клик был не по нашему блоку
      && div.has(e.target).length === 0 ||!opener.is(e.target)) { // и не по его дочерним элементам
      div.removeClass('open'); // скрываем его
    }
  });
  function tooltip(opener,open){
    $(opener).click(function(){
      if($(this).find(open).hasClass('open')){
        $(this).find(open).removeClass('open')
      }else{
        $(this).find(open).addClass('open');
      }
    });

  }
  tooltip('.tooltip-opener','.tooltip');

  $('.tt-input').focus(function(){
    var $label;
    $label=$(this).parents('.twitter-typeahead').next('label');
    $label.addClass('filled');
  });

  $('.tt-input').blur(function(){
    var $label;
    $label = $(this).parents('.twitter-typeahead').next('label');
    if(this.value==0) {
      $label.removeClass('filled');
    }
  })
});
