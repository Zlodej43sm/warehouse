(function (factory) {
  if (typeof define === "function" && define.amd)
    define(["jquery"], factory)
  else factory(jQuery)
}(function ($) {

  var $contract = $('#contract_display');
  var $edit     = $('#contract_edit');

  $.get('/widgetContractText/' + WIDGET_UNIQUE_ID, function (data) {
    $contract.html(data.contract);
    var texts = data.texts;

    var $saveButton    = $('[name=save]');
    var $restoreButton = $('[name=restore]');

    $saveButton.click(function () {
      $.ajax('/contract/' + WIDGET_ID, {
        method:  'PUT',
        data:    texts,
        success: function (data) {
          window.location.reload()
        }
      })
    });

    $restoreButton.click(function () {
      $.post({
        url:     '/contract/restore/' + WIDGET_ID,
        success: function () {
          window.location.reload()
        }
      })
    });

    _.each(texts, function (val, key) {
      var $input           = $('<div><input name="' + key + '" type="text" value="' + val.replace(/"/g, "&quot;") + '"></input></div>')
      var requestedElement = $('#' + key);

      $input.on('input', function (event) {
        var input  = event.target;
        texts[key] = input.value;
        requestedElement.html(input.value);
      });
      $edit.append($input);
      var $created_input = $('[name=' + key + ']');

      $created_input.on('focus', function () {
        requestedElement.css({'border': '1px solid red'});
      });
      $created_input.on('blur', function () {
        requestedElement.css({'border': '0px'});  //todo: addClass\removeClass
      });

    });

  });
}));
