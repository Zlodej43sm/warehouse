jQuery(function ($) {

  var $body               = $('body')
    , $userRole           = $('#user-role')
    , $partnersRow        = $('#partners-row')
    , $departmentsRow     = $('#departments-row')
    , $partnersControl    = $("[name=partners]", $partnersRow)
    , $departmentsControl = $("select[name=departments]", $departmentsRow)
    , $orderTimeVisible   = $('#time-visible');

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
        render:  function (partners) {
          return $.map(partners, function (partner) {
            return '<div class="badge badge-default">' + partner.title + '</div>'
          }).join(" ");
        },
        targets: 3
      },
      {
        render:  function (departments) {
          return $.map(departments, function (department) {
            return '<div class="badge badge-default">'
            + department.city
            + ', ' + department.address
            + (department.house ? ', ' + department.house : '')
            + (department.comment ? ' (' + department.comment + ')' : '')
            + '</div>'
          }).join(" ");
        },
        targets: 4
      },
      {
        render:  function (data, type, o, e) {
          var dataKey = e.settings.aoColumns[e.col].data;
          if ($.type(data) == 'object') {
            var finalButton;
            switch (dataKey.buttonType) {
              case 'delete':
                finalButton = !data.isSU ? deleteButton.attr('data-deleteUrl', 'user/' + data.id).clone().prop('outerHTML') : '';
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
  }).data('dtGrid');

  var validateRules = {
    password:         {
      required:  true,
      minlength: 6
    },
    confirm_password: {
      required: true,
      equalTo:  "input[name=password]"
    },
    email:            {
      required: true,
      email:    true
    },
    first_name:       'required'
  };

  var loadDepartments = function () {
    $.get('/partner/' + $partnersControl.val() + '/departments', function (data) {
      $departmentsControl.find('option').remove();
      $.each(data, function () {
        var option = $("<option/>")
          .val(this.id)
          .html(
            this.city + ", " + this.address
            + (this.house ? ', ' + this.house : '')
            + (this.comment ? ' (' + this.comment + ')' : '')
          ).appendTo($departmentsControl);
        if (window.USER_DEPARTMENTS) {
          option.prop("selected", USER_DEPARTMENTS.indexOf(this.id) >= 0);
        }
      });
    });
  };

  $('#user-update').qForm({
    remote:   false,
    validate: validateRules
  });

  $('#user-create').qForm({
    remote:   true,
    validate: validateRules
  });

  $body.on('user-create:success', function (e, data) {
    if (data && data.redirectUrl) window.location.replace(data.redirectUrl);
  });

  $body.on('change-password:success', function (e, data) {
    if (data.flash) pushNoty(data.flash.type, data.flash.message);
  });

  $userRole.on('change', function () {
    $partnersRow.addClass('hidden');
    $departmentsRow.addClass('hidden');
    $orderTimeVisible.addClass('hidden');
    $departmentsControl.prop("disabled", true);

    if ($userRole.val() == 'D') {
      $orderTimeVisible.removeClass('hidden');
    }

    if ($userRole.val() == 'P' || $userRole.val() == 'D' || $userRole.val() == 'G' || $userRole.val() == 'SM') {
      $partnersRow.removeClass('hidden');
      $partnersControl.prop("multiple", false).find('option').eq(0).show();
    }

    if ($userRole.val() == 'E') {
      $partnersRow.removeClass('hidden');
      $partnersControl.prop("multiple", true).find('option').eq(0).hide();
    }

    if ($partnersControl.val() && ($userRole.val() == 'D' || $userRole.val() == 'G' || $userRole.val() == 'SM')) {
      $departmentsRow.removeClass('hidden');
      $departmentsControl.prop("disabled", false);
      loadDepartments();
    }
  }).trigger('change');

  $partnersControl.on('change', function () {
    if ($userRole.val() != 'D' && $userRole.val() != 'G' && $userRole.val() != 'SM') return;
    if (!$partnersControl.val()) return;
    $departmentsRow.removeClass('hidden');
    $departmentsControl.prop("disabled", false);
    loadDepartments();
  }).trigger('change');

});
