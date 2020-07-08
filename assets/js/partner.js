function coverImage() {
  return 1;
}

jQuery(function ($) {

  var $body = $('body');
  var $datatable = $('.datatable');
  var mailType = $('[name=mailType]');
  var mailTypeOptions = $('[name=mailType] option');
  var mailGroup = $('.mail-group');
  var mainForm = $('[id=mainForm]')
  var aggregator = $('[name=allMailsData]')

  function initMailForm() {
    var availableValues = {};

    mailTypeOptions.each(function () {
      var value = $(this).attr('value');
      if (value === '') {
        return;
      }
      $.ajax({
        url:    window.location.href + '/' + value,
        method: 'GET'
      }).done(function (data) {
        availableValues[value] = data;
      });
    });

    mailGroup.each(function () {
      $(this).on('change', function () {
        availableValues[mailType.val()][$(this).attr('name')] = $(this).val();
      })
    });

    mainForm.submit(function () {
      aggregator.val(JSON.stringify(availableValues))
    })

    mailType.on('change', function () {
      var that = this;
      var needToDisable = !this.value

      needToDisable ? $('.hidable').addClass('hidden') : $('.hidable').removeClass('hidden');

      mailGroup.each(function () {
        $(this).attr('disabled', needToDisable);
        $(this).val(needToDisable ? null : availableValues[that.value][$(this).attr('name')])
      });
    })
  }

  initMailForm();


  var deleteButton = $('<button formmethod="delete"/>')
    .addClass('btn btn-default button-delete')
    .append('delete');

  $datatable.on('draw.dt', function () {
    $datatable.find('.button-delete').on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      $.ajax({
        url:    '../' + $(this).attr('data-deleteUrl'),
        method: 'DELETE'
      }).done(function () {
        location.reload(); //not the best way to do this, 100% there are better ways
      });
    });
  });

  if (!$('*').is('#widgets') && !$('*').is('#departments')) // if we don't  #widgets or #departments section on page
    $datatable.dtGrid({
      columnDefs: [
        {
          render:  function (data, type, o, e) {
            var dataKey = e.settings.aoColumns[e.col].data;
            if ($.type(data) == 'object') {
              var finalButton;
              switch (dataKey.buttonType) {
                case 'delete':
                  finalButton = deleteButton.attr('data-deleteUrl', 'partner/' + data.id).clone().prop('outerHTML');
                  break;
                default:
                  finalButton = '';
              }
              return finalButton;
            }
            return data;
          },
          targets: -1
        },
        {
          render:  function (data, type, o, e) {
            return  !!data?
              '<input type=checkbox checked onclick="return false"/>'
              : '<input type=checkbox onclick="return false"/>'
          },
          targets: 1
        },
      ]
    });

  // if we have #widgets section on page
  $("#widgets").each(function () {
    var widgetsDtGrid = $(this).find('.datatable').dtGrid({
      columnDefs: [
        {
          render:  function (url) {
            return '<img width="100" src="' + url + '"/>';
          },
          targets: 0
        }, {
          render:  function (data, type, o, e) {
            var dataKey = e.settings.aoColumns[e.col].data;
            if ($.type(data) == 'object') {
              var finalButton;
              switch (dataKey.buttonType) {
                case 'delete':
                {
                  finalButton = deleteButton.attr('data-deleteUrl', 'widget/' + data.id).clone().prop('outerHTML');
                  break;
                }
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

    $body.on('widget-create:success widget-update:success', function (e) {
      widgetsDtGrid.draw();
    });

  });

  // if we have #departments section on page
  $("#departments").each(function () {

    var departmentsDtGrid = $(this).find('.datatable').dtGrid({
      columnDefs: [
        {
          render:  function (row) {
            return row.address
            + (row.house ? ', ' + row.house : '')
            + (row.comment ? ' (' + row.comment + ')' : '');
          },
          targets: 1,
        },
        {
          render:  function (users) {
            return $.map(users, function (user) {
              return '<div class="badge badge-default">' + user.email + '</div>'
            }).join(" ");
          },
          targets: 2,
        },
        {
          render:  function (row) {
            return Math.round(row.latitude * 10000) / 10000 || '-';
          },
          targets: 4,
        },
        {
          render:  function (row) {
            return Math.round(row.longitude * 10000) / 10000 || '-';
          },
          targets: 5,
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
          targets: -1,
        },
        {
          render:  function (data, type, o, e) {
            return  !!data?
              '<input type=checkbox checked onclick="return false"/>'
              : '<input type=checkbox onclick="return false"/>'
          },
          targets: 3,
        },
      ]
    }).data('dtGrid');
    $body.on('department-create:success department-update:success', function (e) {
      window.location.reload();
    });

  });


  /**
   * PARTNER CREATED
   */

  $body.on('partner-create:success', function (e, data) {
    var datatable = $body.find('.datatable').dataTable();
    datatable.fnAddData(data);
    window.location = '/p/' + data.id;
  });


  /**
   * NEW DEPARTMENT
   */

  var $newDepartment = $("#new-department")
    , $userEmailRow  = $(".user-email-row", $newDepartment);

  $newDepartment.on('change', function () {
    var $this     = $(this)
      , isChecked = $this.prop('checked');

    isChecked
      ? $userEmailRow.removeClass('hidden').find('input').focus()
      : $userEmailRow.addClass('hidden');
  });

  // fix always opened user email row in department modal window
  $body.on('hide.bs.modal', function (e) {
    if (!$userEmailRow.length) return;
    $userEmailRow.addClass('hidden');
  });

  // init typeahead on new department modal window
  $('input[name=city], input[name=address]').each(function () {
    var $input     = $(this)
      , displayKey = this.name;

    var source = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace(displayKey),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote:         {
        url:      '/department?where={"' + displayKey + '":{"contains":"%QUERY"},"partner":"' + CURRENT_PARTNER_ID + '"}',
        wildcard: '%QUERY'
      },
      dupDetector:    function (remoteMatch, localMatch) {
        return remoteMatch.id === localMatch.id;
      }
    });

    var options = {
      hint:      true,
      highlight: true,
      minLength: 1
    };

    var adapter = {
      name:       'department-' + displayKey,
      displayKey: displayKey,
      source:     source,
      limit:      5
    };

    $input.typeahead(options, adapter);
  })

  function initYandexMap(latitude, longitude, action) {
      var mapPlaceHolder = document.getElementById("mapPlaceHolder" + action);
      if (!mapPlaceHolder) {
          return;
      }
      var form = document.getElementById('department-' + action.toLowerCase());
      $(mapPlaceHolder).empty()
      var yandexMap = new ymaps.Map(mapPlaceHolder, {
          center: [
              latitude,
              longitude
          ],
          zoom: 17,
      }, {
          searchControlProvider: 'yandex#search'
      });
      var myPlacemark = new ymaps.Placemark(yandexMap.getCenter(), {
          hintContent: '',
          balloonContent: ''
      }, {
      });
      yandexMap.geoObjects.add(myPlacemark);
      yandexMap.behaviors.get('drag').options.set('inertia', false);
      yandexMap.events.add('boundschange', function() {
          var coords = yandexMap.getCenter();
          myPlacemark.geometry.setCoordinates(coords);
          try {
              form.elements.latitude.value = coords[0];
              form.elements.longitude.value = coords[1];
          } catch (ex) {
              console.log(ex);
          }
      });
  }

  function initGoogleMap(latitude, longitude, action) {
      var mapPlaceHolder = document.getElementById("mapPlaceHolder" + action);
      var form = document.getElementById('department-' + action.toLowerCase());
      var center = new google.maps.LatLng(
          latitude,
          longitude
      );
      var mapProp = {
          center: center,
          zoom: 17,
          scrollwheel: false,
          mapTypeControlOptions: {
              mapTypeIds: [google.maps.MapTypeId.ROADMAP]
          },
          mapTypeControl: true,
          draggable: true,
          scaleControl: true,
          navigationControl: true,
          streetViewControl: true
      };
      var map = new google.maps.Map(mapPlaceHolder, mapProp);
      var marker = new google.maps.Marker({
          position: center,
      });
      marker.setMap(map);
      var input = document.createElement('input');
      input.setAttribute("type", "text");
      document.body.appendChild(input)
      var searchBox = new google.maps.places.SearchBox(input);
      map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
      map.addListener('bounds_changed', function() {
          var bounds = map.getBounds();
          var center = bounds.getCenter();
          marker.setPosition({
              lat: center.lat(),
              lng: center.lng()
          });
          searchBox.setBounds(map.getBounds());
          try {
              form.elements.latitude.value = center.lat();
              form.elements.longitude.value = center.lng();
          } catch (ex) {
              console.log(ex);
          }

      });
      searchBox.addListener('places_changed', function() {
          var places = searchBox.getPlaces();
          if (places.length == 0) {
              return;
          }
          var bounds = new google.maps.LatLngBounds();
          places.forEach(function(place) {
              if (place.geometry.viewport) {
                  bounds.union(place.geometry.viewport);
              } else {
                  bounds.extend(place.geometry.location);
              }
          });
          map.fitBounds(bounds);
      });
  }

  $(document).on('shown.bs.modal', function(event) {
      var formCreate = document.getElementById('department-create');
      //initYandexMap(0, 0, 'Create');
      initGoogleMap(0, 0, 'Create')
      try {
          var form = document.getElementById('department-update');
          var latitude = form.elements.latitude && form.elements.latitude.value || 0;
          var longitude = form.elements.longitude && form.elements.longitude.value || 0;
          setTimeout(function() {
            //initYandexMap(latitude, longitude, 'Update');
            initGoogleMap(latitude, longitude, 'Update');
          }, 500);
        } catch (ex) {
          ;
        }
  });

});
