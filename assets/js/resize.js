void function() {

  $(function() {
    x_navigation_onresize();
    $(window).resize(function() {
      x_navigation_onresize();
    });
  });

  function x_navigation_onresize() {
    var inner_port = window.innerWidth || $(document).width();
    if (inner_port < 1025) {
      $(".page-sidebar .x-navigation").removeClass("x-navigation-minimized");
      $(".page-container").removeClass("page-container-wide");
      $(".page-sidebar .x-navigation li.active").removeClass("active");
      $(".x-navigation-horizontal").each(function() {
        if (!$(this).hasClass("x-navigation-panel")) {
          $(".x-navigation-horizontal").addClass("x-navigation-h-holder").removeClass("x-navigation-horizontal");
        }
      });
    } else {
      if ($(".page-navigation-toggled").length > 0) {
        x_navigation_minimize("close");
      }
      $(".x-navigation-h-holder").addClass("x-navigation-horizontal").removeClass("x-navigation-h-holder");
    }
  }

  $(".x-features-nav-open").on("click", function(e) {
    $(".x-hnavigation").toggleClass("active");
  });

  $(".x-hnavigation .xn-openable > a").on("click", function(e) {
    if ($(this).parent("li").hasClass("active")) {
      $(this).parent("li").removeClass("active");
    } else {
      $(".x-hnavigation .xn-openable").removeClass("active");
      $(this).parents("li").addClass("active");
    }
  });

  $(".x-features .x-features-profile").on("click", function(e) {
    e.stopPropagation();
    $(this).toggleClass("active");
  });

  $(".x-features .x-features-search").on("click", function(e) {
    e.stopPropagation();
    $(this).addClass("active");
    $(this).find("input[type=text]").focus();
  });

  $(".x-navigation-horizontal .panel").on("click", function(e) {
    e.stopPropagation();
  });

  x_navigation();

  function x_navigation() {

    $(".x-navigation-control").click(function() {
      $(this).parents(".x-navigation").toggleClass("x-navigation-open");
      return false;
    });

    if ($(".page-navigation-toggled-hover").length > 0) {
      $(".page-sidebar").hover(function() {
        $(".x-navigation-minimize").trigger("click");
      }, function() {
        $(".x-navigation-minimize").trigger("click");
      });
    }

    $(".x-navigation-minimize").click(function() {
      if ($(".page-sidebar .x-navigation").hasClass("x-navigation-minimized")) {
        $(".page-container").removeClass("page-navigation-toggled");
        x_navigation_minimize("open");
      } else {
        $(".page-container").addClass("page-navigation-toggled");
        x_navigation_minimize("close");
      }
      return false;
    });

    $(".x-navigation  li > a").click(function() {
      var li = $(this).parent('li');
      var ul = li.parent("ul");
      ul.find(" > li").not(li).removeClass("active");
    });

    $(".x-navigation li").click(function(event) {
      event.stopPropagation();
      var li = $(this);
      if (li.children("ul").length > 0 || li.children(".panel").length > 0 || $(this).hasClass("xn-profile") > 0) {
        if (li.hasClass("active")) {
          li.removeClass("active");
          li.find("li.active").removeClass("active");
        } else
          li.addClass("active");
        if ($(this).hasClass("xn-profile") > 0)
          return true;
        else
          return false;
      }
    });

    $(".xn-search").on("click", function() {
      $(this).find("input").focus();
    })
  }
}();
