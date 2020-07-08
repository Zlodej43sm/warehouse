module.exports = function calc(values, cb) {

  var widgetId  = values.widget || values.id
    , productId = values.product;

  if (!widgetId) return cb(new Error('Widget `id` not defined.'));
  if (!productId) return cb(new Error('Product `id` not defined.'));

  calc.appearanceValue = values.appearance;
  calc.equipmentValue = values.equipment;

  Widget
    .findOne(widgetId)
    .populate('partner')
    .exec(function (err, widget) {
      if (err) return cb(err);
      if (!widget) return cb(new Error('No widget found with the specified `id`.'));
      calc.partner = widget.partner;
      calc.widgetPriceCoeff = helper.getWidgetCoeff(widget);
        Product
          .findOne(productId)
          .exec(function (err, product) {
            if (err) return cb(err);
            if (!product) return cb(new Error('No product found with the specified `id`.'));
            calc.product = product;
            cb(null, calc._calculate());
          }); // Product.findOne
    }); // Widget.findOne
};

module.exports._calculate = function () {

  var coeff          = helper.getPriceCoeff()
    , price          = this.product.price * coeff * this.widgetPriceCoeff
    , appearanceRate = helper.appearance[this.appearanceValue].rate
    , equipmentRate  = helper.equipment[this.equipmentValue].rate
    , result = 0
    , resultFrom = 0
    , appearanceRateFrom = 0;

  if (this.partner.useInterval && this.appearanceValue > 1) {
      appearanceRateFrom = helper.appearance[this.appearanceValue - 1].rate;
  }
  // TODO:
  if (_.isArray(this.partner.appearanceRates)) {
    var index = calc.appearanceValue - 1
      , rate  = parseFloat(this.partner.appearanceRates[index])
      , rateFrom = 0;
    if (this.partner.useInterval && index > 0) {
        rateFrom = parseFloat(this.partner.appearanceRates[index - 1])
    }
    if (rate > 0) appearanceRate = rate;
    if (rateFrom > 0) appearanceRateFrom = rateFrom;
  }

  // TODO:
  if (_.isArray(this.partner.equipmentRates)) {
    var index = calc.equipmentValue - 1
      , rate  = parseFloat(this.partner.equipmentRates[index]);
    if (rate > 0) equipmentRate = rate;
  }
  let roundTo = this.partner.roundTo;
  if (!roundTo) {
    roundTo = 1;
  }
  result = price * (appearanceRate + equipmentRate);
  result = Math.floor(result / roundTo) * roundTo;
  if (this.partner.useInterval &&  appearanceRateFrom > 0) {
      resultFrom = price * (appearanceRateFrom + equipmentRate);
      resultFrom = Math.floor(resultFrom / roundTo) * roundTo;
  }
  const productPrice = calc.product.price * coeff;
  const detailed_price = Order.getDetailedPrice(result);
  return {
    price: result,
    priceFrom: resultFrom,
    formattedPrice: helper.formatPrice(result),
    formattedPriceFrom: helper.formatPrice(resultFrom),
    productPrice,
    full_price:     detailed_price.full_price,
    product:        this.product,
  }
};
