(function (factory) {
  if (typeof define === "function" && define.amd)
    define(["jquery"], factory)
  else factory(jQuery)
}(function ($) {
  "use strict";

  var userDtGrid = $('.datatable').dtGrid({
    processing: false,
    serverSide: true,
    ajax: '/product/datatable',
    createdRow: function (row, data, index) {
      var $row = $(row);
      $row.addClass('dropzone').dropzone({
        previewsContainer: $row.find("td:first")[0],
        url: '/product/upload?id=' + data.id,
        // maxFiles: 1,
        clickable: false,
        thumbnailWidth: 50,
        thumbnailHeight: 50,
        acceptedFiles: 'image/*',
        success: function (file, res) {
          var images = $row.find('td:first img');
          if (images.length > 1) images.eq(0).remove();
        },
        init: function () {
          $row.find('.dz-message').remove();
        }
      });
    },
    columnDefs: [
      {
        render: function (data) {
          if (data.image) {
            var imgSrc = data.image.slice(0, 4) === 'http' ? data.image : "/media/product/" + data.image;
            return '<img src=\"' + imgSrc +'\"  height="50"/>'
          }
          return '';
        },
        targets: 0
      }
    ]
  }).data('dtGrid');

  $('body').on('coeff-set:success', function (e, data) {
    window.location = '/products';
  });

}));
