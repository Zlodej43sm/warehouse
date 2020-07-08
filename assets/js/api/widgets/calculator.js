(function (factory) {
  if (typeof define === 'function' && define.amd)
    define(['jquery'], factory)
  else factory(jQuery)
}(function ($) {

  'use strict';
  $.validator.messages.required = window.customWidgetTexts.validatorMessageRequired;
  $.validator.messages.email    = window.customWidgetTexts.validatorMessageEmail;

  var calc
    , wizard
    , $body = $('body');

  var rpc = new fastXDM.Client({
    onInit: function () {
      rpc.callMethod('onInit');
      setTimeout(function () {
        rpc.callMethod('resizeWidget', $body.outerHeight());
      }, 1);
    }
  }, {safe: true});

  var datumTokenizer = function (d, displayKey) {
    var tokens     = [];
    //the available string is 'name' in your datum
    var stringSize = d[displayKey].length;
    //multiple combinations for every available size
    //(eg. dog = d, o, g, do, og, dog)
    for (var size = 1; size <= stringSize; size++) {
      for (var i = 0; i + size <= stringSize; i++) {
        tokens.push(d[displayKey].substr(i, size));
      }
    }
    return tokens;
  };

  function Calculator(strategy) {
    this.$form            = $('#section-wizard form');
    this.$priceEst        = $('#price-estimated');
    this.$priceEstFrom    = $('#price-estimated-from');
    this.$priceEstFromBlock = $('.price-from');
    this.$phone           = $('input[name=phone]');
    this.$appearance      = $('input[name=appearance]');
    this.$equipment       = $('input[name=equipment]');
    this.$device          = $('input[name=device]');
    this.$brand           = $('input[name=device_brand]');
    this.$model           = $('input[name=device_model]');
    this.$city            = $('input[name=city]');
    this.$address         = $('input[name=address]');
    this.$productImage    = $('#product-image');
    this.$notebook        = $('#notebook');
    this.$tv              = $('#tv');
    this.temporaryStorage = {};
    this.strategy = strategy;

    var that = this;

    this.$notebook.on('change', function (event) {
      $('.notebook-input').attr('required', event.target.checked);

      var typeInput = $('#device_type');
      if (event.target.checked) {
        that.temporaryStorage['device_type'] = typeInput.val();
        typeInput.val('Компьютер');
      } else {
        typeInput.val(that.temporaryStorage['device_type']);
      }
      rpc.callMethod('resizeWidget', $body.outerHeight());
    });

    this.calc             = {};
    this.getDataForWizard = function () {
      return this.calc;
    };
    this.currentCity      = '';

    if (strategy === 'simple') {
      this.brandTypeahead();
    }

    //if (this.$device.length) this.initDeviceTypeahead();
    if (this.$city.length) this.initCityTypeahead();
    if (this.$address.length) this.initAddressTypeahead();

    this.init();
  }

  Calculator.prototype.destroyInputTypeahead = function (el) {
    el.typeahead('destroy');
    el.typeahead('val', '');
    el.val('');
  };

  Calculator.prototype.init = function () {
    var _this = this;

    this.$phone.mask('+38(099)999-99-99');

    this.$appearance.on('change', function () {
      if (!!this.value) {
        _this.calc.appearance = parseInt(this.value, 10);
        var label             = $('label[for=appearance-' + this.value + ']').text();
        $('#appearance-description').html(label);
      }
      else delete _this.calc.appearance;
      _this.calculatePrice();
    });

    this.$equipment.on('change', function () {
      if (!!this.value) {
        _this.calc.equipment = parseInt(this.value, 10);
        var label            = $('label[for=equipment-' + this.value + ']').text();
        $('#equipment-description').html(label);
      }
      else delete _this.calc.equipment;
      _this.calculatePrice();
    });

    this.$device.on('change', function (e, product) {
      if (product && product.id) {
        _this.calc.product = product.id;
        $('#product-name').html(product.name);
        _this.$productImage.attr('src', product.imageUrl || '');
      }
      else if (e.isTrigger) { // Firefox triggers additional event after focus lose, need refactoring
        delete _this.calc.product;
      }
      _this.calculatePrice();
    });
  };

  Calculator.prototype.calculatePrice = function () {
    var _this = this
      , valid = true;

    valid = valid && !!this.calc.product;
    valid = valid && !!this.calc.appearance;
    valid = valid && !!this.calc.equipment;

    if (!valid) {
      _this.$priceEst.html(0);
      _this.$priceEstFrom.html('');
      _this.$priceEstFromBlock.hide();
      return this;
    }

    $.post('/widget/' + window.WIDGET_ID + '/calculate', this.calc)
      .done(function (res) {
        _this.$priceEst.html(res.price);
        if (Number(res.priceFrom)) {
            _this.$priceEstFrom.html(res.priceFrom);
            _this.$priceEstFromBlock.show();
        } else {
            _this.$priceEstFrom.html('');
            _this.$priceEstFromBlock.hide();
        }
      });
  };

  Calculator.prototype.brandTypeahead = function ($input, type) {
    var _this = this;

    var source = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.whitespace,
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote:         {
        url:      '/widget/brands?q=%QUERY' + category(),
        wildcard: '%QUERY'
      }
    });

    function category() {
      if (wizard && wizard.isEstimateStrategy()) {
        return '';
      }
      if (_this.$tv.prop('checked')) {
        return '&type=' + encodeURIComponent('Телевизоры, Фото, Видео');
      } else {
        return '&notype=' + encodeURIComponent('Телевизоры, Фото, Видео');
      }
    }

    var options = {
      hint:      true,
      highlight: true,
      minLength: 0
    };

    var adapter = {
      name:      type,
      source:    source,
      limit:     65536,
      templates: {
        empty: '<div class="no-results tt-suggestion">' + window.__.deviceNotFound + '</div>'
      }
    };

    var onSelected = function (e, brand) {
      _this.destroyInputTypeahead(_this.$model);
      _this.initModelList(brand);
    };

    var onChange = function () {
      _this.destroyInputTypeahead(_this.$model);
      _this.initModelList($(this).val());
    };

    var tvChange = function() {
      _this.destroyInputTypeahead(_this.$brand);
      _this.brandTypeahead();
      _this.destroyInputTypeahead(_this.$model);
      _this.initModelList(_this.$brand.val());
    };

    this.$tv.change(tvChange);
    this.$brand.change(onChange);
    this.$brand.typeahead(options, adapter)
      .on('typeahead:selected', onSelected);
  };

  Calculator.prototype.initModelList = function (brand) {
    var _this      = this;
    var type       = 'modelTypeahead'
      , displayKey = 'name';

    if (brand) {
      _this.$model.prop('disabled', false);
    } else {
      _this.$model.prop('disabled', true);
    }

    function category() {
      if (wizard && wizard.isEstimateStrategy()) {
        return '';
      }
      if (_this.$tv.prop('checked')) {
        return '&type=' + encodeURIComponent('Телевизоры, Фото, Видео');
      } else {
        return '&notype=' + encodeURIComponent('Телевизоры, Фото, Видео');
      }
    }
    var source = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace(displayKey),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote:         {
        url:      '/widget/models/' + brand + '?q=%QUERY' + category(),
        wildcard: '%QUERY'
      }
    });

    var options = {
      hint:      true,
      highlight: true,
      minLength: 0
    };

    var adapter = {
      name:       type,
      displayKey: displayKey,
      source:     source,
      limit:      65536,
      templates:  {
        empty: '<div class="no-results tt-suggestion">' + window.__.deviceNotFound + '</div>'
      }
    };

    var onSelected = function (e, product) {
      _this.$device.trigger('change', [product]);
    };

    _this.$model.typeahead(options, adapter)
      .on('typeahead:selected', onSelected);
  };

  /**
   * Init City Typeahead
   */

  Calculator.prototype.initCityTypeahead = function () {
    var _this      = this
      , displayKey = this.$city.attr('name');

    var _source = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.whitespace,
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      prefetch:       {
        url:   '/widget/' + WIDGET_ID + '/cities',
        cache: false,
        ttl:   1000
      }
    });

    var source = function (q, sync) {
      if (q === '') sync(_source.all());
      else _source.search(q, sync);
    };

    var options = {
      hint:      true,
      highlight: true,
      minLength: 0
    };

    var adapter = {
      name:   'department-' + displayKey,
      source: source,
      limit:  65536
    };

    this.$city
      .typeahead(options, adapter)
      .on('typeahead:selected', function (e, city) {
        _this.currentCity = city;
        _this.initAddressTypeahead();
      })
      .on('typeahead:change', function (e) {
        if (!e.target.value) {
          _this.$address.prop('disabled', true);
          _this.$address.typeahead('val', '');
        }
      });
  };


  /**
   * Init Address Typeahead
   */

  Calculator.prototype.initAddressTypeahead = function () {
    var _this      = this
      , displayKey = 'full_address';
    _this.$address.typeahead('val', '');
    _this.$address.typeahead('destroy');

    var _source = new Bloodhound({
      datumTokenizer: function (d) {
        return datumTokenizer(d, displayKey);
      },
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      prefetch:       {
        url:   '/widget/' + window.WIDGET_ID + '/departments?city=' + encodeURIComponent(_this.currentCity),
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

    var source  = function (q, sync) {
      if (q === '') sync(_source.all());
      else _source.search(q, sync);
    };

    var options = {
      hint:      true,
      highlight: true,
      minLength: 0
    };

    var adapter = {
      name:       'department-' + displayKey,
      displayKey: displayKey,
      source:     source,
      limit:      65536
    };

    this.$address
      .prop('disabled', false)
      .typeahead(options, adapter)
      .off('typeahead:selected')
      .on('typeahead:selected', function (e, department) {
        _this.calc.department = department.id;
      })
      .on('typeahead:change', function (e) {
        if (!e.target.value) {
          _this.$address.prop('disabled', true);
          _this.$address.typeahead('val', '');
        }
      });

    if (!this.$city.val()) {
      this.$address.prop('disabled', true);
    }
  };

  Calculator.prototype.reset = function () {
    this.calc = {};
    $('.list-group-item.active', this.$form).removeClass('active');
  };


  function Wizard() {
    /**
     * wizard strategy: "simple" or "estimate"
     * by default: null
     */
    this.strategy = null;

    /**
     * find required elements
     */
    this.findElements();

    /**
     * init wizard events
     */
    this.initEvents();
  }

  Wizard.prototype.findElements = function () {
    this.$wizardSimpleBtn   = $('#wizard-simple');
    this.$wizardEstimateBtn = $('#wizard-estimate');
    this.$wizardResetBtn    = $('.wizard-reset');
    this.$sectionMain       = $('#section-main');
    this.$sectionWizard     = $('#section-wizard');
    this.$sectionSuccess    = $('.section-success');
    this.$wizardRows        = $('[class*="row__"]', this.$sectionWizard);
    this.$wizard            = $('.wizard', this.$sectionWizard);
    this.$wizardForm        = $('form', this.$sectionWizard);
    this.$nav               = $('.nav', this.$sectionWizard);
    this.$navSteps          = this.$nav.find('li');
    this.$productName       = $('#product-name');
    this.$productImage      = $('#product-image');
    this.$deviceType        = $('input[name=device_type]');
    this.$deviceBrand       = $('input[name=device_brand]');
    this.$deviceModel       = $('input[name=device_model]');
    this.$deviceProc        = $('input[name=device_proc]');
    this.$deviceRam         = $('input[name=device_ram]');
    this.$deviceHard        = $('input[name=device_hard]');
    this.$deviceVideo       = $('input[name=device_video]');
  };

  Wizard.prototype.initEvents = function () {
    var _this = this;

    $([]).add(this.$wizardSimpleBtn).add(this.$wizardEstimateBtn).on('click', function (e) {
      var strategy   = this.id.split('-')[1];
      _this.strategy = strategy;
      calc  = new Calculator(strategy);
      _this.run();
      e.preventDefault();
    });

    this.$wizardResetBtn.on('click', function (e) {
      // _this.reset();
      e.preventDefault();
      window.location.reload();
    });

    var validate = function () {
      return this.$wizardForm.validate({
        errorElement:      'div',
        errorElementClass: 'text-danger',
        errorClass:        'validation-error',
        validClass:        'validation-passed',
        errorPlacement:    function (error, element) {
          if (element.is(':radio')) {
            error.appendTo(element.parents('.condition-form')).animate({opacity: 0}, 1500).delay(1, function () {
              $(this).remove();
            });
          }
          else if (element.next('label.text-input-label').length) {
            error.insertAfter(element.next('label')).animate({opacity: 0}, 1500).delay(1, function () {
              element.closest('.row').removeClass('error');
              $(this).remove();
            });
            element.closest('.row').addClass('error');
          }
          else if (element.is(':checkbox')) {
            error.insertAfter(element.next('label')).animate({opacity: 0}, 1500).delay(1, function () {
              $(this).remove();
            });
          }
          else {
            error.insertAfter(element).animate({opacity: 0}, 1500).delay(1, function () {
              $(this).remove();
            });
          }
        },
        rules:             {
          appearance: 'required',
          equipment:  'required',
        },
        messages:          {
          appearance: window.customWidgetTexts.validatorMessageAppearance,
          equipment:  window.customWidgetTexts.validatorMessageEquipment
        }
      });
    }.bind(this);

    this.validator = validate();

    $([])
      .add(this.$deviceType)
      .add(this.$deviceBrand)
      .add(this.$deviceModel)
      .add(this.$deviceRam)
      .add(this.$deviceProc)
      .add(this.$deviceHard)
      .add(this.$deviceVideo)
      .on('change', function () {
        var name = [_this.$deviceType.val(), _this.$deviceBrand.val(), _this.$deviceModel.val(),
          _this.$deviceProc.val(), _this.$deviceRam.val(), _this.$deviceHard.val(), _this.$deviceVideo.val()].join(' ');
        _this.$productName.html($.trim(String(name).replace(/</g, '&lt;')));
      });

    // this.$wizardSimpleBtn.trigger('click');
    // this.$wizardEstimateBtn.trigger('click');
  };

  Wizard.prototype.run = function () {
    this.$sectionMain.hide();
    this.$sectionWizard.show();
    this.$wizardRows.hide().filter('.row__' + this.strategy).show();
    if (!this._wizard) {
      this.init();
      this.initForm();
      this.initUploader();
    }
  };
  var inProcess = false;
  Wizard.prototype.initForm = function () {
    var _this = this;

    this.$wizardForm.on('submit', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (inProcess) {
        return;
      }

      if (!_this.$wizardForm.valid()) return;

      var formData = $.extend({
        widget:  window.WIDGET_ID,
        partner: window.PARTNER_ID
      }, calc.getDataForWizard());

      $.each(_this.$wizardForm.serializeArray(), function () {
        if (!!this.value) formData[this.name] = this.value;
      });

      inProcess = true;
      $.ajax({
        url:    _this.$wizardForm.attr('action'),
        method: _this.$wizardForm.attr('method'),
        data:   formData
      }).done(function (data) {
        data.equipmentDescripton = $('label[for=equipment-' + data.equipment + ']').text();
        data.appearanceDescription = $('label[for=appearance-' + data.appearance + ']').text();
        if (data.device_images && data.device_images[0]) {
          data.imageUrl =
            window.location.protocol + '//'
            + window.location.host
            + '/media/customer-device/'
            + data.device_images[0];
        } else if (data.product && data.product.image) {
          data.imageUrl = data.product.image;
        }
        if (window.widgetType === 'rozetka') {
          var params = [];
          if (data.device_type) {
            [params.push(data.device_type)]
          }
          params.push(data.device_brand, data.device_model);
          if (data.notebook) {
            params.push(data.device_proc, data.device_ram, data.device_hard, data.device_video);
          }
          params.push(data.equipmentDescripton, data.appearanceDescription);
            /*var form = document.createElement('form');
            $(form).attr('action', $('#postUrl').val())
                .attr('method', 'post')
                //.attr('target', '_top');
            $(form).append($(document.createElement('input'))
                .attr('name', 'ext_id')
                .attr('type', 'hidden')
                .val(data.id));
            $(form).append($(document.createElement('input'))
                .attr('name', 'price')
                .attr('type', 'hidden')
                .val(data.price_estimated || 0.01));
                $(form).append($(document.createElement('input'))
                    .attr('name', 'title')
                    .attr('type', 'hidden')
                    .val(params.join(' ')
                    )
                  );
            $(form).appendTo(document.body);
            form.submit();*/
          $.ajax({
            url: $('#postUrl').val(),
            method: 'POST',
            // contentType: "application/json; charset=utf-8",
            // dataType: "json",
            data: {
              ext_id: data.id,
              price: data.price_estimated || 0.00,
              title:params.join(' '),
            },
            xhrFields: {
              withCredentials: true
            }
          }).done(function(data){
            _this.complete();
            try {
              window.top.postMessage('tehnostok-iframe-success', '*');
            } catch (ex) {
              ;
            }
            try {
              if (window.top !== window.parent) {
                window.parent.postMessage('tehnostok-iframe-success', '*');
              }
            } catch (ex) {
              ;
            }
          }).fail(function(error){
            inProcess = false;
            console.log(error);
          });

        } else {
          _this.complete();
          inProcess = false;
        }
      }).fail(function(error) {
        inProcess = false;
        console.log(error);
      });
    });
  };

  Wizard.prototype.init = function () {
    var _this = this;

    this.$wizard.smartWizard({
      labelNext:        window.customWidgetTexts.mainNextButton,
      labelPrevious:    window.customWidgetTexts.mainBackButton,
      labelFinish:      window.widgetType == 'rozetka' ? window.customWidgetTexts.orderFinishButton : window.customWidgetTexts.mainFinishButton,
      transitionEffect: 'fade',
      keyNavigation:    false,
      onLeaveStep:      function (obj) {
        var valid         = true
          , stepContainer = $(obj.attr('href'));

        $('input,textarea', stepContainer).filter(':visible').each(function (i, v) {
          valid = _this.validator.element(v) && valid;
        });

        if (!valid) {
          _this.$wizard.find('.stepContainer').removeAttr('style');
          _this.validator.focusInvalid();
          return false;
        }

        return true;
      },
      onShowStep:       function () {
        _this.$navSteps.removeClass('active').has('a.done').addClass('active');
        rpc.callMethod('resizeWidget', $body.outerHeight());
      }
    });

    $('.stepContainer').css('height', '');  // remove height added by wizard , because it makes impossible
    // to change widget height due to dynamical form size changing

    this._wizard = true;
  };

  Wizard.prototype.reset = function () {
    this.strategy = null;
    this.$wizardForm[0].reset();
    this.$sectionWizard.hide();
    this.$sectionSuccess.hide();
    this.$sectionMain.show();
    this.$wizard.data('smartWizard').reset();
    calc.reset();
  };

  Wizard.prototype.complete = function () {

    var addressObject = {};

    $.each(this.$wizardForm.serializeArray(), function () {
      if (this.name === 'city') {
        addressObject.city = this.value;
      }
      if (this.name === 'address') {
        addressObject.address = this.value;
      }
    });

    var addressString = addressObject.city ?
    addressObject.city + (addressObject.address ?
    ', ' + addressObject.address : '') : '';

    if (addressString) {
      $('p.simple-thanks-txt').show();
      this.$sectionSuccess.find('#full-address').text(addressString);
    } else {
      $('p.simple-thanks-txt').hide();
    }
    this.$sectionWizard.hide();
    this.$sectionSuccess.hide().filter('.row__' + this.strategy).show();
    this.$wizardForm[0].reset();
    this.strategy = null;
  };

  Wizard.prototype.isSimpleStrategy = function () {
    return this.strategy === 'simple';
  };

  Wizard.prototype.isEstimateStrategy = function () {
    return this.strategy === 'estimate';
  };

  Wizard.prototype.initUploader = function () {
    var _this = this;

    $('#uploader').dropzone({
      url:     window.UPLOAD_URL,
      success: function (file, res) {
        _this.$productImage.attr('src', res.url);
        $('<input/>').attr({
          type:  'hidden',
          name:  'device_images[]',
          value: res.name
        }).appendTo(_this.$wizardForm);
      }
    });
  };

  wizard = new Wizard();
  // calc   = new Calculator();

}));
