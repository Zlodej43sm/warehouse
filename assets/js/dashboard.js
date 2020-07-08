(function (factory) {
  if (typeof define === "function" && define.amd)
    define(["jquery"], factory)
  else factory(jQuery)
}(function ($) {

  "use strict";

  var $reportrange   = $("#reportrange")
    , $datatable     = $('.datatable')
    , reportLinkTmpl = '/order/export?';

  if ($datatable.length) {
    var downloadButton = $('<button/>')
      .addClass('btn btn-default btn-rounded export-report')
      .append('<span class="fa fa-download"></span>')
      .append('csv');

    var badgeSpan = $('<span/>').addClass('badge');

    var currentReportDataRange = {
      fromDate : moment().startOf('day').toDate(),
      toDate   : moment().endOf('day').toDate()
    };

    $datatable.on("click", '.export-report', function () {
      var data = $.extend($(this).data(), currentReportDataRange)
        , url  = '/order/export?' + $.param(data);
      downloadFile(url);
    });

    var reportDtGrid = $('.datatable').dtGrid({
      drawOnInit: false,
      columnDefs: [
        {
          render: function (data, type, o, e) {
            var dataKey = e.settings.aoColumns[e.col].data;

            if ($.type(data) == 'string') {
              return data;
            }

            if ($.type(data) == 'number' && data == 0) {
              return badgeSpan
                .clone()
                .addClass('state-' + dataKey)
                .html(data)
                .prop('outerHTML');
            }

            downloadButton.attr('data-partner', o.partner.id);

            if ($.type(data) == 'number') {
              return badgeSpan
                .clone()
                .addClass('push-right-5 state-' + dataKey)
                .html(data)
                .prop('outerHTML')
              + downloadButton
                .clone()
                .attr('data-state', dataKey)
                .prop('outerHTML');
            }

            if ($.type(data) == 'object') {
              return downloadButton.clone().prop('outerHTML');
            }

            return '';
          },
          targets: '_all'
        }
      ]
    }).data('dtGrid');


    var ACTUAL_SECONDS = 3600; // Если интервал меньше часа то перезапрашиваем от актуального времени
    $reportrange.on('show.daterangepicker', function(ev, picker) {
      var diff = moment(picker.endDate).diff(moment(picker.startDate))/1000;
      if (diff < ACTUAL_SECONDS) {
          picker.setEndDate(moment());
      }
    });
    $reportrange.daterangepicker({
      ranges: {
        'Последние 30 минут': [moment().subtract(30, 'minutes'), moment()],
        'Сегодня': [moment().startOf('day'), moment().endOf('day')],
        'Вчера': [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')],
        'Последние 7 дней': [moment().subtract(6, 'days').startOf('day'), moment().endOf('day')],
        'Последние 30 дней': [moment().subtract(29, 'days').startOf('day'), moment().endOf('day')],
        'В этом месяце': [moment().startOf('month'), moment().endOf('month')],
        'В прошлом месяце': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
      },
      opens: 'left',
      buttonClasses: ['btn btn-default'],
      applyClass: 'btn-small btn-primary',
      cancelClass: 'btn-small',
      format: 'DD-MM-YYYY',
      timePicker: true,
      separator: '-',
      startDate: moment().startOf('day'),
      endDate: moment().endOf('day'),
    }, function(start, end) {
      var diff = end.diff(start)/1000;
      if (diff < ACTUAL_SECONDS) {
        end = moment();
        start = moment(end).subtract(diff, 'seconds')
      }
      currentReportDataRange = {
        fromDate: start.toDate(),
        toDate: end.toDate(),
      };
      reportDtGrid.draw(currentReportDataRange);
      if (diff < ACTUAL_SECONDS) {
        start.add(1, 'seconds');
        $('span', $reportrange).html(start.format('Время от HH:mm') + ' до ' + end.format('HH:mm'));
      } else {
        $('span', $reportrange).html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
      }
    });

    // draw on init
    reportDtGrid.draw(currentReportDataRange);
    $('span', $reportrange).html(moment().startOf('day').format('MMMM D, YYYY') + ' - ' + moment().endOf('day').format('MMMM D, YYYY'));
  }

}));
