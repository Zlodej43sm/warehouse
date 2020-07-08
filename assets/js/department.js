jQuery(function ($) {
  var $datatable = $('.datatable');

  var deleteButton = $('<button formmethod=""/>')
    .addClass('btn btn-default button-delete')
    .append('delete');

  $datatable.on('draw.dt', function () {
    $datatable.find('.button-delete').on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      $.ajax({
        url:    '../' + $(this).attr('data-deleteUrl'),
        method: 'DELETE'
      }).always(function () {
        location.reload();
      });
    });
  });

  $datatable.dtGrid({
    columnDefs: [
      {
        render:  function (users) {
          return $.map(users, function (user) {
            return '<div class="badge badge-default">' + user.email + '</div>'
          }).join(" ");
        },
        targets: 2
      },
      {
        render:  function (data, type, o, e) {
          var dataKey = e.settings.aoColumns[e.col].data;
          if ($.type(data) == 'object') {
            var finalButton;
            switch (dataKey.buttonType) {
              case 'delete':
                finalButton = deleteButton.attr('data-deleteUrl', 'department/' + data.id).clone().prop('outerHTML');
                break;
              default:
                finalButton = '';
            }
            return finalButton;
          }
          return data;
        },
        targets: -1
      }
    ]
  }).data('dtGrid');

});
