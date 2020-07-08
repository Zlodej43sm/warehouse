(function (factory) {
  if (typeof define === "function" && define.amd)
    define(["jquery"], factory)
  else factory(jQuery)
}(function ($) {

  var language_panel = $('#user-locale');

  language_panel.on('change', function (event) {
    $.ajax('/changeLanguage', {
      method: 'POST',
      data: {locale: this.value},
      success: function (data) {
        window.location.reload();
      }
    })
  })
}));
