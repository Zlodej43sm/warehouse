var moment = require('moment');

module.exports = {

  sendOk: function (res, Model, matchingRecords, user, pagination) {
    var defaults = {filters: {}}
      , modelOptions
      , response;


    // Translate column title by default
    defaults.tColumnsTitle = true;
    defaults.createdAt = true;
    defaults.updatedAt = true;

    // Default column data filters
    // Filter createdAt column
    defaults.filters.createdAt = function () {
      return moment(this.createdAt).format('L LT');
    }

    // Filter updatedAt column
    defaults.filters.updatedAt = function () {
      return moment(this.updatedAt).format('L LT');
    }

    //
    modelOptions = _.merge(defaults, Model.datatable && _.isObject(Model.datatable) ? Model.datatable : {});

    //
    response = {
      columns: _.filter(modelOptions.columns, (c)=> !c.isNotDisplayed) || [],
      data:    matchingRecords || [],
      order:   modelOptions.order || []
    };

    //
    if (modelOptions.createdAt) response.columns.push({
      data:       "createdAt",
      title:      "Created At",
      width:      200,
      searchable: false
    });

    //
    if (modelOptions.updatedAt) response.columns.push({
      data:       "updatedAt",
      title:      "Updated At",
      width:      200,
      searchable: false
    });

    if (user && user.isSuperUser() && !Model.noDeleteButton) {
      response.columns.push({
        data:       {
          buttonType: 'delete'
        },
        orderable:  false,
        title:      sails.__(''),
        searchable: false
      });
    }
    //
    if (modelOptions.tColumnsTitle) _.each(response.columns, function (column) {
      column.title = res.__({phrase:column.title, locale: user.getLocale()});
    });

    _.each(matchingRecords, function (record) {
      if (modelOptions.editPathEx) record.editPath = strformat(modelOptions.editPathEx, record);
      if (modelOptions.dataToggle) record.dataToggle = modelOptions.dataToggle;

      // handle column filters
      _.each(modelOptions.filters, function (filterCallback, colName) {
        record[colName] = filterCallback.call(record, user);
      });
    });

    response.oLanguage = {
      oPaginate: {
        sNext:     '»',
        sPrevious: '«',
        sFirst:    res.__('First page'),
        sLast:     res.__('Last page')
      }
    };

    if (pagination) {
      Object.assign(response, pagination);
    }

    res.ok(response);
  }

}
