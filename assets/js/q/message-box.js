(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["jquery"], factory)
  } else {
    factory(jQuery)
  }
}(function ($) {

  "use strict";

  var CACHE    = {};
  var REGISTER = {};

  function MessageBox(options) {
    this.options = $.extend({
      href: null,
      animSpeed: 1000,
      animated: true,
      type: 'info', // info, danger, warning, success (or empty string for default)
      animatedIn: 'fadeIn',
      animatedOut: 'fadeOut',
      overlayClickClose: true,
      cache: true,
      confirmation: null
    }, options);
    this.init();
  }

  MessageBox.prototype = {
    init: function(){
      if(this.options.control) {
        this.control = $(this.options.control);
        $.extend(this.options, this.control.data());

        if (!this.options.href) {
          this.options.href = this.control.attr("href");
        }

        this.isAnchor       = this.options.href.indexOf('#') === 0;
        this.isConfirmation = !!this.options.confirmation;
        this.loader         = '<div class="mb-loader"><span class="fa fa-spinner fa-spin"></span>Please wait...</div>';

        this.attachEvents();
        this.makeCallback('onInit', this);
      }
    },
    attachEvents: function(){
      var that = this;

      that.control
        .on("click.mb", function(e){
          e.preventDefault();
          e.stopPropagation();
          that.isAnchor ? that.show() : that.showContent();
        })
        .on("shown.mb", function(){
          $("html").on("keyup.mb", function(e){
            if (e.keyCode == 27) { //Esc
              that.hide();
            }
          });
          // that.focusForm();
        })
        .on("hidden.mb", function(){
          $("html").off("keyup.mb");
          if (that.form && that.form.length) {
            that.form.qForm('reset');
          }
        })
        .on("cancel.mb", function(e){
          e.preventDefault();
          that.hide();
        })
        .on("confirmation-ok.mb", function(e){
          e.preventDefault();
          that.control.trigger("click.rails");
        });
    },
    show: function(){
      var that = this
        , o    = that.options;

      if (!that.holder) {
        that.holder    = $(o.href);
        that.container = that.holder.find('.mb-container');
        that.prepareForm();
        that.handleActionButtons();
      }

      this.applyMessageBoxType();

      if (o.animated) {
        that.holder.addClass('animated').removeClass(o.animatedOut).addClass(o.animatedIn).show();
      } else {
        that.holder.fadeIn(o.animSpeed);
      }

      that.resize();
      that.control.trigger('shown.mb', [that]);
    },
    prepareForm: function(){
      var that = this;

      that.form = that.container.find('form');

      if (that.form.length && !that.form.data('qForm')) {
        that.form
        .qForm({type:"json"})
        .on("success.qf", function(e, data, status, xhr){
          if (data.notice) {
            App.noty({text: data.notice, type: 'information'});
          }
          that.hide();
          // that.holder.trigger('success.mb', [data, status, xhr]);
          // App.dispatch('user_group_created', [data, status, xhr]);
        });
      }
    },
    focusForm: function(){
      this.holder.find(":input:visible:enabled:first").focus();
    },
    hide: function(){
      var that    = this
        , o       = that.options
        , handler = function(){
            that.holder.hide();
            that.abortRequest();
          };

      if (o.animated) {
        that.holder.removeClass(o.animatedIn).addClass(o.animatedOut);
        setTimeout(handler, o.animSpeed);
      } else {
        that.holder.fadeOut(o.animSpeed, handler);
      }

      that.control.trigger('hidden.mb', [that]);
    },
    resize: function(){
      this.container.css({
        top: '50%',
        marginTop: - (this.container.outerHeight() / 2) + 'px'
      });
    },
    showContent: function(){
      var that     = this
        , o        = that.options
        , isCached = o.cache && CACHE[o.href];

      if (REGISTER[o.href]) {
        that.holder = $('#' + REGISTER[o.href]);
      } else {
        that.holder      = $('<div class="message-box"><div class="mb-container"></div></div>').uid().appendTo('body');
        REGISTER[o.href] = that.holder.attr("id");
      }

      that.container = that.holder.find('.mb-container');

      if (!isCached) {
        that.isConfirmation ? that.showConfirmation() : that.loadContent();
      } else {
        that.prepareForm();
      }

      that.show();
    },
    loadContent: function(){
      var that = this
        , o    = that.options;

      that.container.html(that.loader);

      that._request = $.post(o.href, function(data){
        that.container.html(data);
        that.prepareForm();
        that.focusForm();
        that.handleActionButtons();
        that.resize();
        if (o.cache) {
          CACHE[o.href] = data;
        }
      });
    },
    showConfirmation: function(){
      var that      = this
        , o         = that.options;

      o.type = 'danger';

      that.container.html(
          '<div class="mb-middle">'
        + '  <div class="mb-title">'+ o.confirmation +'</div>'
        + '  <div class="mb-footer">'
        + '    <div class="pull-right">'
        + '      <button class="btn btn-close push-right-10" data-action="cancel" type="button">Cancel</button>'
        + '      <button class="btn btn-create" data-action="confirmation-ok" type="button">Yes</button>'
        + '    </div>'
        + '  </div>'
        + '</div>'
      );

      that.handleActionButtons();
      that.control.one('shown.mb', that.playAudio.bind(that, 'alert'));
    },
    applyMessageBoxType: function(type){
      var type = type || this.options.type;
      this.holder.removeClass('message-box-info message-box-danger message-box-warning message-box-success')
      if (type) {
        this.holder.addClass("message-box-" + type);
      }
    },
    handleActionButtons: function(){
      var that = this;

      that.holder.on("click.mb", function(e){
        if (that.options.overlayClickClose && that.holder.is(e.target)) {
          that.hide();
        }
      });

      that.holder.find('[data-action]').each(function(){
        var control = $(this)
          , action  = control.data('action');

        control.on('click', function(e){
          // that.makeCallback('onAction' + _.capitalize(action), e);
          that.control.trigger(action + '.mb', [that]);
        });
      });
    },
    abortRequest: function(){
      if (this._request) {
        this._request.abort();
        this._request = null;
      }
    },
    makeCallback: function(name){
      if(typeof this.options[name] === 'function') {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        this.options[name].apply(this, args);
      }
    },
    playAudio: function(file){
      if(file === 'alert')
        document.getElementById('audio-alert').play();
      if(file === 'fail')
        document.getElementById('audio-fail').play();
    }
  };

  $.fn.messageBox = function(opt){
    return this.each(function(){
      $(this).data('messageBox', new MessageBox($.extend(opt,{control:this})));
    });
  };
}));
