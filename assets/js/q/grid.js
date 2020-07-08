(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["jquery"], factory)
  } else {
    factory(jQuery)
  }
}(function ($) {

  "use strict";

  var $body = $('body');

  var callRemoteModal = function (url) {
    $.get(url, function(res){
      var $modal = $(res).appendTo($body)

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

  function DtGrid (options, table) {
    this.options = $.extend({
      stateSave: true,
      autoWidth: false,
      drawOnInit: true,
      createdRow: function(row, data, index) {
        if (data.editPath) {
          $(row).addClass('cp').on('click', function(){
            if (!data.dataToggle) return window.location = data.editPath;
            switch (data.dataToggle) {
              case 'modal':
                callRemoteModal(data.editPath);
            }
          })
        }
      }
    }, options);

    if (!table) return;

    this.$grid       = $(table);
    this.initOptions = this.$grid.data();
    this.datatable   = null;

    this.init();
  }

  DtGrid.prototype.init = function () {
    if (!this.initOptions.ajax) return;
    if (this.options.drawOnInit) this.draw();
  };

  DtGrid.prototype.draw = function (params) {
    var _this = this
      , params = params || {};
    return $.get(this.initOptions.ajax, params, function(res){
      if (!res) return;

      if (!_this.loaded) {
        _this.loaded = true;
        _this.$grid.removeData();
        _this.$grid.dataTable($.extend({}, res, _this.options));
      }
      else {
        _this.$grid.fnClearTable();
        $.each(res.data, function () {
          _this.$grid.fnAddData(this)
        })
      }
    });
  };

  $.fn.dtGrid = function (opt) {
    return this.each(function () {
      var $this    = $(this)
        , instance = $this.data('dtGrid');

      if (!instance) {
        $this.data('dtGrid', new DtGrid(opt, this));
      }
    });
  };

}));
