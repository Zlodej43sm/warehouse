(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["jquery"], factory)
  } else {
    factory(jQuery)
  }
}(function ($) {

  $.validator.messages.required = customWidgetTexts.validatorMessageRequired;

  this.$address = $('[name=address]');
  this.$form = $('#order-edit');
  this.$sectionMain = $('#section-main');
  this.$sectionSuccess = $('#section-success');
  this.formData = {};

  function setAddressString() {
    var city = ADDRESS_DATA.city;
    var address = ADDRESS_DATA.address !== '' ? ADDRESS_DATA.address : this.$form.find('#address')[0].value;
    var addressString = city ? city + (address ? ', ' + address : '') : '';
    this.$sectionSuccess.find('#final-addr').text(addressString);
  }

  var initAddressTypeahead = function () {
    var displayKey = 'address';

    var source = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace(displayKey),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote:         {
        url:      '/widget/' + WIDGET_ID + '/departments',
        wildcard: '%QUERY',
        cached:   false,
        replace:  function (url, uriEncodedQuery) {
          var newUrl = url + '?q=' + uriEncodedQuery;
          newUrl += '&city=' + CUSTOMER_CITY;
          return newUrl;
        },
      }
    });

    var options = {
      hint:      true,
      highlight: true,
      minLength: 0
    };

    var adapter = {
      name:       'department-' + displayKey,
      displayKey: displayKey,
      source:     source,
      limit:      1000
    };

    this.$address
      .typeahead(options, adapter)
      .on('typeahead:selected', function (e, department) {
        formData.department = department.id;
      });
  };

  initAddressTypeahead();
  setAddressString();

  var _this = this;
  this.$form
    .qForm({formData: formData})
    .on('complete.qf', function () {
      setAddressString();
      _this.$sectionMain.hide();
      _this.$sectionSuccess.show();
    })


}));
