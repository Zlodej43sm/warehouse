(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["jquery"], factory)
  } else {
    factory(jQuery)
  }
}(function ($) {

  "use strict";

  var translit = (function() {
    var L = {
      'А': 'A', 'а': 'a', 'Б': 'B', 'б': 'b', 'В': 'V', 'в': 'v', 'Г': 'G', 'г': 'g',
      'Д': 'D', 'д': 'd', 'Е': 'E', 'е': 'e', 'Ё': 'Yo', 'ё': 'yo', 'Ж': 'Zh', 'ж': 'zh',
      'З': 'Z', 'з': 'z', 'И': 'I', 'и': 'i', 'Й': 'Y', 'й': 'y', 'К': 'K', 'к': 'k',
      'Л': 'L', 'л': 'l', 'М': 'M', 'м': 'm', 'Н': 'N', 'н': 'n', 'О': 'O', 'о': 'o',
      'П': 'P', 'п': 'p', 'Р': 'R', 'р': 'r', 'С': 'S', 'с': 's', 'Т': 'T', 'т': 't',
      'У': 'U', 'у': 'u', 'Ф': 'F', 'ф': 'f', 'Х': 'Kh', 'х': 'kh', 'Ц': 'Ts', 'ц': 'ts',
      'Ч': 'Ch', 'ч': 'ch', 'Ш': 'Sh', 'ш': 'sh', 'Щ': 'Sch', 'щ': 'sch', 'Ъ': '', 'ъ': '',
      'Ы': 'Y', 'ы': 'y', 'Ь': "", 'ь': "", 'Э': 'E', 'э': 'e', 'Ю': 'Yu', 'ю': 'yu',
      'Я': 'Ya', 'я': 'ya', ' ': '_',
      '"': '', "'": '', '.': '', ',': '', '!': '', ':': '', ';': ''
    },
    r = '',
    k;
    for (k in L) r += k;
    r = new RegExp('[' + r + ']', 'g');
    k = function (a) {
      return a in L ? L[a] : '';
    };
    return function (str) {
        var text_string = str.replace(r, k).toString();

        var literals = 'QqWwEeRrTtYyUuIiOoPpAaSsDdFfGgHhJjKkLlZzXxCcVvBbNnMm_-0123456789';
        var newString = '';
        for (var i = 0; i < text_string.length; i++) {
          if (!(literals.indexOf(text_string.charAt(i)) == -1)) {
            newString += text_string.charAt(i);
          };
        };
        return newString.replace(/\s+/g, ' ').replace(/\-+/g, '-').replace(/\_+/g, '_');
    };
  })();

  function QForm(options) {
    this.options = $.extend({
      validate     : {},
      remote       : true,
      type         : 'json',
      fieldPattern : null,
      dispatchName : null,
      formData     : {},
      errorPlacement: null,
      /**
       * Duplicator
       *
       * Example: [{
       *   target: 'field1',
       *   duplicateTo: 'field2',
       *   translit: true,
       *   lowerCase: true
       * }]
       */
      duplicator   : [],
      beforeSend   : function(){},
      success      : function(){}
    }, options);
    this.init();
  }

  QForm.prototype = {
    init: function(){
      if(this.options.form) {
        this.form         = $(this.options.form);
        this.options      = $.extend({}, this.options, this.form.data());
        this.formId       = this.form.attr("id");
        this.dispatchName = this._getDispatchName();

        if (!this.options.fieldPattern) {
          this.setFieldPattern();
        }

        if (this.issetValidator()) {
          this.makeValidator();
        }

        if (this.isAjaxForm()) {
          this.makeAjaxForm();
        }

        if (this.issetDuplicator()) {
          this.makeDuplicator();
        }

        this.makeCallback('onInit', this);
      }
    },
    _getDispatchName: function(){
      var dispatchName = this.options.dispatchName ? this.options.dispatchName : this.formId;
      if (!dispatchName) dispatchName = _.trim(this.form.attr('action'), '/').replace('/', '.');
      return dispatchName;
    },
    reset: function(){
      this.__validator.resetForm();
      this.form[0].reset();
    },
    makeValidator: function(){
      var that = this;

      var options = {
        errorElement: "div",
        errorElementClass: "text-danger", // animated zoomIn
        errorClass: "validation-error",
        validClass: "validation-passed",
      };

      if (this.issetFieldPattern()) {
        options.rules = {};
        $.each(this.options.validate, function(fieldName, fieldValidator){
          options.rules[that.getFieldName(fieldName)] = fieldValidator;
        });
      } else if (this.options.validate) {
        options.rules = this.options.validate;
      }

      if (this.options.errorPlacement) {
        options.errorPlacement = this.options.errorPlacement;
      }

      this.__validator = this.form.validate(options);
    },
    makeAjaxForm: function(){
      var that = this;

      that.form.on('success.qf', function(e, data, status, xhr){
        if (that.dispatchName) {
          $('body').trigger(that.dispatchName + ':success', [data, status, xhr]);
        }
      });

      that.form.on("submit", function(e){
        var url      = that.form.attr("action")
          , method   = that.form.attr('method')
          , formData = new FormData()
          , dataType = that.options.type || ($.ajaxSettings && $.ajaxSettings.dataType)
          , submit   = that.form.find(':submit');

        e.preventDefault();

        if ((that.issetValidator() && !that.form.valid()) || !url) {
          return;
        }

        $.each(that.form.serializeArray(), function(){
          formData.append(this.name, this.value);
        });

        $.each(that.options.formData, function(name, value){
          formData.append(name, value);
        });

        that.form.find(":file").each(function(){
          var fieldName = this.name;
          $.each(this.files, function(){
            formData.append(fieldName, this);
          });
        });

        $.ajax(url, {
          beforeSend: function(xhr, settings){
            that.form.trigger('send.qf', xhr);
            submit.prop("disabled", true);
          },
          success: function(data, status, xhr){
            that.form.trigger('success.qf', [data, status, xhr]);
          },
          complete: function(xhr, status) {
            that.form.trigger('complete.qf', [xhr, status]);
            submit.prop("disabled", false);

            var res       = xhr.responseJSON
              , resErrors = {};

            if (res && res.error == 'E_VALIDATION') {
              pushNoty('error', res.summary, true);
              $.each(res.invalidAttributes, function(fieldName, fieldErrors){
                var error = $.map(fieldErrors, function(err){
                  return err.message;
                });
                resErrors[that.getFieldName(fieldName)] = error.join(" * ");
              });
            }

            if (Object.keys(resErrors).length && that.__validator) {
              that.__validator.showErrors(resErrors);
              that.focusForm();
            }
          },
          error: function(xhr, status, error) {
            that.form.trigger('error.qf', [xhr, status, error]);
          },
          processData: false,
          contentType: false,
          data: formData,
          type: method ? method : 'post',
          dataType: dataType
        });

        return false;
      });
    },
    focusForm: function(){
      this.form
        .find("input, textarea")
        .filter(":visible:first:enabled")
        .focus();
    },
    makeDuplicator: function(){
      var that = this;

      $.each(this.options.duplicator, function(i, o){
        var from = that.getFieldByName(this.target)
          , to   = that.getFieldByName(this.duplicateTo);

        from.on("keyup.qfd paste.qfd cut.qfd focusin.qfd", function(e){
          var val = this.value;
          if (o.translit) {
            val = translit(val);
          }
          if (o.lowerCase) {
            val = val.toLowerCase();
          }

          to.val(val);

          if (that.__validator && val.length) {
            to.valid();
          }
        });
      });
    },
    makeCallback: function(name){
      if(typeof this.options[name] === 'function') {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        this.options[name].apply(this, args);
      }
    },
    issetValidator: function(){
      // return $.isPlainObject(this.options.validate) && !$.isEmptyObject(this.options.validate);
      return true;
    },
    issetFieldPattern: function(){
      return $.type(this.options.fieldPattern) === "string";
    },
    setFieldPattern: function(){
      var fieldName = this.form.find(':text:eq(0)').attr('name') || null;
      var pattern = /\[[a-z0-9_]+\]/;
      if (pattern.test(fieldName)) {
        this.options.fieldPattern = fieldName.replace(pattern, '[%field%]');
      }
    },
    issetDuplicator: function(){
      return $.isArray(this.options.duplicator) && this.options.duplicator.length;
    },
    isAjaxForm: function(){
      return this.options.remote;
    },
    getFieldName: function(name){
      return this.issetFieldPattern() ? this.options.fieldPattern.replace("%field%", name) : name;
    },
    getFieldByName: function(name){
      return this.form.find('[name="'+ this.getFieldName(name) +'"]');
    }
  };

  $.fn.qForm = function(opt){
    return this.each(function(){
      var $this    = $(this)
        , instance = $this.data('qForm');

      if (!instance) {
        $this.data('qForm', new QForm($.extend(opt,{form:this})));
      }

      if (_.isString(opt)) {
        if (_.isFunction(instance[opt])) {
          instance[opt].call(instance);
        } else {
          console.log('QFORM UNKNOW METHOD: ', opt);
        }
      }
    });
  };
}));
