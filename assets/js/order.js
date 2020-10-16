(function (factory) {
  if (typeof define === "function" && define.amd)
    define(["jquery"], factory)
  else factory(jQuery)
}(function ($) {
  "use strict";
  var $datatable   = $('.datatable');
  var deleteButton = $('<button formmethod="delete"/>')
    .addClass('btn btn-default button-delete')
    .append('delete');


  $('#orderFields').on('hidden.bs.modal', function () {
    window.location.reload();
  })
  // validation
  //---------------------------------------------------
  $.validator.messages.digits = VALIDATOR_DIGITS;
  $.validator.addMethod("greater-than-zero", function (value, element) {
    var v = parseNumber(value);
    return !isNaN(v) && v > 0;
  }, VALIDATOR_GREATER_THAN_ZERO);
  //----------------------------------------------------


  $datatable.on('draw.dt', function () {
    $datatable.find('.button-delete').on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      $.ajax({
        url: 'order/' + $(this).attr('id'),
        method: 'DELETE'
      }).done(function () {
        location.reload(); //not the best way to do this, 100% there are better ways
      });
    });
  });

  var order;

  var templates = {
    suggestion: function () {
      return Handlebars.compile($("#suggestion-tmpl").html())
    },
    empty: function () {
      return Handlebars.compile($("#empty-tmpl").html())
    }
  };

  function hideNonActiveFormElements(objects, filter) {
    objects.find('input').prop('disabled', true);
    objects.addClass('hidden');
    objects.filter(filter).removeClass('hidden').find('input').prop('disabled', false);
  }

  var parseNumber = function (v) {
    if (typeof v != 'string') {
      return parseFloat(v);
    }

    var isDot  = v.indexOf('.');
    var isComa = v.indexOf(',');

    if (isDot != -1 && isComa != -1) {
      if (isComa > isDot) {
        v = v.replace('.', '').replace(',', '.');
      }
      else {
        v = v.replace(',', '');
      }
    }
    else if (isComa != -1) {
      v = v.replace(',', '.');
    }

    return parseFloat(v);
  };

  function Order() {
    var self = this;

    this.$body                  = $('body');
    this.$form                  = $('#order-edit, #order-new');
    this.$appearance            = $('input[name=appearance]');
    this.$equipment             = $('input[name=equipment]');
    this.$department            = $('input[name=department]');
    this.$device                = $('input[name=device]');
    this.$modelInput            = $('input[name=standard_device_model]')
    this.$product               = $('input[name=product]');
    this.$city                  = $('input[name="city"]');
    this.$address               = $('input[name=address]');
    this.$priceEstHolder        = $('#price-estimated');
    this.$priceEstBillsHolder   = $('#price-estimated-bills');
    this.$productImage          = $('#product-image');
    this.$deviceImage           = $('#device_image');
    this.$priceEstHolderSpinner = $('#price-estimated-spinner');
    this.$partners              = $('#partners');
    this.$widgets               = $('[class*=partnerWidgets]');
    this.$originalProduct       = $('#originalProduct');
    this.$editDeviceBlock       = $('#edit-device-block');
    this.$standardDeviceModel   = $('[name="standard_device_model"]');
    this.$standardDeviceBrand   = $('[name="standard_device_brand"]');

    this.$editDeviceBlock.slideUp();

    $('#edit-device-btn').on('click',function(){
      //self.$standardDeviceBrand.val(window.DEVICE_BRAND);
      //self.$standardDeviceBrand.trigger('change');
      //self.$standardDeviceBrand.trigger('select');
      self.$editDeviceBlock.slideDown();
    });

    $('#cancel-device-btn').on('click',function(){
      self.$editDeviceBlock.slideUp();
      self.$product.trigger('change', {id: self.$originalProduct.val()});
      //self.$standardDeviceBrand.val('');
      //self.$standardDeviceBrand.trigger('change');
      //self.$standardDeviceBrand.trigger('select');
    });

    if (window.DEVICE_BRAND) {
      this.initModelList(window.DEVICE_BRAND);
    }

    this.calc = {
      product: this.$product.val(),
      appearance: this.$appearance.filter(':checked').val(),
      equipment: this.$equipment.filter(':checked').val(),
      partner: this.$partners.filter(':checked').val(),
    };

    this.initTypeaheads();
    if (window.WIDGET_ID) {
      this.calc.id = window.WIDGET_ID;
      var currentCity = this.$city.val()
      this.initCityTypeahead({val: currentCity});
    }
    // if (Number(window.PRICE_ESTIMATED)) {
    //   $('.price-details').addClass('hidden');
    // }

    if (!this.calc.partner) {
      this.calc.partner = window.PARTNER_ID || '';
    }
    this.initCalculator();
    if (this.$form.length) this.initForm();
    this.initGrid();
    this.initOrderType();
  };


  Order.prototype.initOrderType = function () {
    var $typeRows  = $('[class*="type__"]');
    var orderTypes = $('input[name=orderType]');
    var _self      = this;


    orderTypes.each(function (index, input) {
      if (orderTypes[index].checked)
        hideNonActiveFormElements($typeRows, '.type__' + $(input).val());
    });

    orderTypes.on('change', function (e) {
      _self.$strategy = this.value; // для того, чтобы добавить статус заявке при отправке, костыль
      e.preventDefault();
      hideNonActiveFormElements($typeRows, '.type__' + this.value);
    });
  };

  Order.prototype.initForm = function () {

    var $fileInput          = $('#deviceImageInput');
    var $defaultDeviceImage = $('#device_image');
    var $form               = this.$form;

    $fileInput.dropzone({
      previewsContainer: '#device_image',
      url: '/order/upload',
      clickable: '#deviceImageInput > div',
      acceptedFiles: 'image/*',
      previewTemplate: '<div class="dz-preview dz-file-preview" style="display:none"><div class="dz-details"><img id="uploaded_image" data-dz-thumbnail /></div></div>',
      error: function (e) {
        console.log(e)
      },
      success: function (file, res) {
        var $uploadedImage = $('[id=uploaded_image]');
        var new_image      = $('<input class="hidden" name="device_images">').val(res.name);
        $form.append(new_image);
        $defaultDeviceImage.attr('src', $uploadedImage.attr('src'));
      },
      init: function () {
        this.on("addedfile", function () {
          if (this.files[1] != null) {
            this.removeFile(this.files[0]);
          }
        });
      },
    });

    $('[name="_restore"]').on('click', function (event) {
      $.ajax({
        url: 'restore/' + ORDER_ID,
        method: 'PUT'
      }).done(function () {
        location.reload(); //not the best way to do this, 100% there are better ways
      });
    });

    $('[name="_reject"]').on('click', function (event) {
      $.ajax({
        url: 'reject/' + ORDER_ID,
        method: 'PUT'
      }).done(function () {
        location.reload(); //not the best way to do this, 100% there are better ways
      });
    });

    var validate = {
      price_new: {
        'greater-than-zero': true
      },
      social_number: {
        digits: true,
        minlength: 10,
        maxlength: 10
      },
      price_estimated: {
        'greater-than-zero': true
      },
      partner: 'required',
      orderType: 'required',
      appearance: 'required',
      equipment: 'required'
    };

    if (typeof PRICE_ESTIMATED != 'undefined' && Number(PRICE_ESTIMATED) > 0) {
      validate.price_estimated.range = [30, PRICE_ESTIMATED];
    }

    this.$form.qForm({
      remote: false,
      validate: validate,
      errorPlacement: function (error, element) {
        if (element.is(":radio")) {
          error.appendTo(element.closest('.radio-group'))
        } else {
          error.insertAfter(element)
        }
      },
    });
  };

  Order.prototype.initGrid = function () {
    $datatable.dtGrid({
        processing: false,
        serverSide: true,
        ajax: '/order/datatable',
        columnDefs: [
          {
            render: function (order) {
              if (order.partner) return order.partner.title;
              return '';
            },
            targets: 3
          }, {
            render: function (order) {
              if (order.department && $.isPlainObject(order.department)) {
                return (order.department.city ? order.department.city + ', ' : '')
                + (order.department.address ? order.department.address : '-')
                + (order.department.house ? ', ' + order.department.house : '')
                + (order.department.comment ? ' (' + order.department.comment + ')': '');
              }
              return (order.city ? order.city + ', ' : '')
              + (order.address ? order.address : '-')
              + (order.house ? ', ' + order.house : '')
              + (order.comment ? ' (' + order.comment + ')': '');
            },
            targets: 4
          }, {
            render: function (data, type, o, e) {
              var dataKey = e.settings.aoColumns[e.col].data;
              if ($.type(data) == 'object') {
                var finalButton;
                switch (dataKey.buttonType) {
                  case 'delete':
                    finalButton = deleteButton.attr('id', data.id).clone().prop('outerHTML');
                    break;
                  default:
                    finalButton = ''
                }
                return finalButton;
              }
              return data;
            },
            targets: -1
          }
        ]
      }
    );
  };

  Order.prototype.initCalculator = function () {
    var _this = this;
    this.$partners.on('change', function (event) {
      _this.calc.partner = event.target.value;
      hideNonActiveFormElements(_this.$widgets, '.partnerWidgets-' + event.target.value);
    });

    this.$widgets.on('change', function (event) {
      _this.calc.id = event.target.value;
      _this.destroyInputTypeahead(_this.$city);
      _this.destroyInputTypeahead(_this.$address);
      _this.initCityTypeahead();
      _this.calculatePrice();
    });

    this.$appearance.on('change', function () {
      if (!!this.value) _this.calc.appearance = parseInt(this.value, 10);
      else delete _this.calc.appearance;
      _this.calculatePrice();
    });

    this.$equipment.on('change', function () {
      if (!!this.value) _this.calc.equipment = parseInt(this.value, 10);
      else delete _this.calc.equipment;
      _this.calculatePrice();
    });

    this.$product.on('change', function (e, product) {
      if (product && product.id) {
        _this.calc.product = product.id;
        _this.$deviceImage.attr("src", product.imageUrl || '');
      }
      else delete _this.calc.product;

      var productId = product && product.id ? product.id : '';

      $(this).val(product.name);
      _this.$product.val(productId);
      _this.calculatePrice();
    });
  };

  Order.prototype.destroyInputTypeahead = function (el) {
    el.typeahead('destroy');
    el.typeahead('val', '');
    el.val('');
  }
  Order.prototype.calculatePrice        = function () {
    var _this = this
      , valid = true;

    valid = valid && !!this.calc.product;
    valid = valid && !!this.calc.appearance;
    valid = valid && !!this.calc.equipment;
    valid = valid && !!this.calc.partner;

    if (!valid) {
      if (!Number(window.PRICE_ESTIMATED)) {
        this.$priceEstHolder.html(0);
      }
      return this;
    }

    this.$priceEstHolderSpinner.removeClass('hidden');

    $.post('/widget/' + WIDGET_ID + '/calculate', this.calc, function (res) {
      _this.$priceEstHolder.html(res.price);
      _this.$priceEstBillsHolder.html(res.full_price);
      if (Number(window.PRICE_ESTIMATED)) {
        _this.$priceEstHolderSpinner.addClass('hidden');
        /* if (_this.$product.val() == _this.$originalProduct.val() && Number(res.price) >= window.PRICE_ESTIMATED) {
          $('input[type=radio]').prop('checked', function () {
            return this.getAttribute('checked') == 'checked';
          });
          $('.price-details').addClass('hidden');
          _this.calc.appearance = parseInt($('input[name="appearance"]:checked').val());
          _this.calc.equipment = parseInt($('input[name="equipment"]:checked').val());
          return;
        } */
        // $('.price-details').removeClass('hidden');
        $('span#price-new').html(res.productPrice);
        $('span#price-estimated-billed').html(res.full_price);
        if (res.priceFrom) {
          $('span#price-estimated-from').html(res.priceFrom);
          $('div.price-estimated-from').show();
        } else {
          $('div.price-estimated-from').hide();
          $('span#price-estimated-from').html(res.price);
        }
        $('span#price-non-billed').html(res.price);
        //$('input[name="price_new"]').val(res.productPrice);
        //$('input[name="price_estimated"]').val(res.price);
      }
    })
  };

  Order.prototype.initTypeaheads = function () {
    var _this = this;

    $('input[data-typeahead]').each(function () {
      var $input = $(this)
        , type   = $input.data('typeahead')
        , key    = type + 'Typeahead';
      if (_this[key]) _this[key]($input, type);
    });
  };

  Order.prototype.brandTypeahead = function ($input, type) {
    var _this = this;

    var source = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.whitespace,
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote: {
        url: '/widget/brands?q=%QUERY',
        wildcard: '%QUERY'
      }
    });

    var options = {
      hint: true,
      highlight: true,
      minLength: 0
    };

    var adapter = {
      name: type,
      source: source,
      limit: 100,
      templates: {
        empty: templates.empty()
      }
    };

    var onSelected = function (e, brand) {
      _this.destroyInputTypeahead(_this.$modelInput);
      _this.initModelList(brand)
    };

    var onChange = function (e, brand) {
      _this.destroyInputTypeahead(_this.$modelInput);
      _this.initModelList($(this).val())
    };

    $input.typeahead(options, adapter)
      .on('typeahead:selected', onSelected);

    $input.change(onChange);
  };

  Order.prototype.initModelList = function (brand) {
    var _this      = this;
    var type       = 'modelTypeahead'
      , displayKey = 'name';

    var source = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace(displayKey),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote: {
        url: '/widget/models/' + brand + '?q=%QUERY',
        wildcard: '%QUERY'
      }
    });

    var options = {
      hint: true,
      highlight: true,
      minLength: 0
    };

    var adapter = {
      name: type,
      displayKey: displayKey,
      source: source,
      limit: 100,
      templates: {
        empty: templates.empty()
      }
    };

    var onSelected = function (e, product) {
      _this.$product.trigger('change', [product]);
    };

    _this.$modelInput.typeahead(options, adapter)
      .on('typeahead:selected', onSelected);
  };

  Order.prototype.initCityTypeahead = function (options) {
    options = options || {};


    if (options.turnOff) {
      this.$city.prop("disabled", true);
      this.$city.addClass("hidden");
      this.$city.typeahead('val', '');
      this.initAddressTypeahead(options)
      return;
    }

    this.$city.removeClass("hidden");
    this.$city.prop("disabled", false);
    // this.destroyInputTypeahead(this.$city);

    var _this      = this
      , displayKey = this.$city.attr('name');

    var _source = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.whitespace,
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      prefetch: {
        url: '/widget/' + _this.calc.id + '/vendor/cities',
        cache: false,
        ttl: 1000
      }
    });

    var source = function (q, sync) {
      if (q === '') sync(_source.all());
      else _source.search(q, sync);
    }

    options = $.extend({
      hint: true,
      highlight: true,
      minLength: 0
    }, options);

    var adapter = {
      name: 'department-' + displayKey,
      source: source,
      limit: 1000
    };
    this.$city
      .typeahead(options, adapter)
      .on('typeahead:selected', function (e, city) {
        _this.currentCity = city;
        _this.initAddressTypeahead();
      })
      .on("typeahead:change", function (e) {
        if (!e.target.value) {
          _this.initAddressTypeahead({turnOff: true})
        }
      });
      _this.currentCity = options.val;
      this.$city.typeahead('val', options.val);

      this.initAddressTypeahead({init: true})
  };

  Order.prototype.initAddressTypeahead = function (options) {
    options        = options || {};
    var _this      = this
      , displayKey = 'full_address';

    if (options.turnOff) {
      this.$address.prop("disabled", true);
      this.$address.addClass("hidden");
      this.destroyInputTypeahead(this.$address);
      return;
    }

    _this.$address.removeClass("hidden");
    if (!options.init) {
      this.destroyInputTypeahead(this.$address);
    }

    var _source = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.whitespace,
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      prefetch: {
        url: '/widget/' + _this.calc.id + '/vendor/departments?city=' + encodeURI(_this.currentCity),
        cache: false,
        transform: function(response) {
          for (var i = 0; i < response.length; i++) {
            response[i].full_address = response[i].address
            + (response[i].house ? ', ' + response[i].house : '')
            + (response[i].comment ? ' (' + response[i].comment + ')': '');
          }
          return response;
        }
      }
    });

    var source = function (q, sync) {
      if (q === '') sync(_source.all());
      else _source.search(q, sync);
    };

    var options = {
      hint: true,
      highlight: true,
      minLength: 0
    };

    var adapter = {
      name: 'department-' + displayKey,
      displayKey: displayKey,
      source: source,
      limit: 10,
    };

    this.$address
      .prop('disabled', false)
      .typeahead(options, adapter)
      .off('typeahead:selected')
      .on('typeahead:selected', function (e, department) {
        _this.$department.val(department.id);
      })
      .on("typeahead:change", function (e) {
        if (!e.target.value) {
          _this.$address.prop("disabled", true);
          _this.$address.typeahead('val', '');
        }
      });

    if (!this.$city.val())
      this.$address.prop('disabled', true)
  };

  order = new Order;

}))
;
