module.exports = {
  orderUsereditPath:         function (order) {
    return helper.getBaseUrl() + '/order/' + order.id;
  },
  getLetterImagePath:        function (image) {
    return helper.getBaseUrl() + '/images/letter/' + image;
  },
  orderEditPath:             function (order) {
    return helper.getBaseUrl() + '/o/' + order.id;
  },
  widgetUploadUrl:           function (widget) {
    return helper.getBaseUrl() + strformat('/widget/{id}/upload', widget);
  },
  /*getDeviceImgUrl: function (order) {
   var image = null;

   if (_.isObject(order) && order.device_images && order.device_images.length) {
   image = order.device_images[0];
   }

   if (_.isString(order)) {
   image = order;
   }

   if (image) {
   return sails.getBaseUrl() + "/media/customer-device/" + image;
   }

   return image;
   },
   getProductImageUrl: function (product) {
   if (!product.image) return false;
   return sails.getBaseUrl() + strformat('/media/product/{image}', product);
   }*/
  getCustomerDeviceImageUrl: function (o) {
    var image = null;
    if (_.isObject(o) && o.device_images && o.device_images.length) {
      image = o.device_images[o.device_images.length - 1];
    }
    if (_.isString(o)) {
      image = o;
    }
    if (image) {
      image = helper.getBaseUrl() + "/media/customer-device/" + image;
    }
    return image;
  },
  getProductImageUrl:        function (o) {
    var image = null;
    if (_.isObject(o)) {
      if (o.device_images && o.device_images.length) {
        image = o.device_images[o.device_images.length - 1];
        return helper.getBaseUrl() + "/media/customer-device/" + image;
      } else {
        _.isObject(o.product) ? image = o.product.image : image = o.image;
      }
    }
    if (image) {
      image = image.slice(0, 4) === 'http' ? image : helper.getBaseUrl() + "/media/product/" + image;
    }
    return image;
  }
};
