(function (factory) {
  if (typeof define === "function" && define.amd)
    define(["jquery"], factory)
  else factory(jQuery)
}(function ($) {
  const EMPTY_DATA_FILLER = '_______';
  const EMPTY_DATA_FILLER_LONG = '_________________________';
  const YEAR = new Date().getFullYear()
  const ITEM_PREFIX = 'contr_item_';
  const TEXT_BLOCK = 'text-block';
  const CONTROLLER_WRAPPER = 'controller-wrapper';
  const INPUT_TAG = 'textarea';
  const ACTIVE = 'active';
  const HIDDEN = 'hidden';
  const CLOSE = 'close';
  const ADD_ITEM = 'add_item';
  const REMOVE_ITEM = 'remove_item';
  const ITEM_PREFIX_REG = new RegExp(ITEM_PREFIX, 'm');
  const $contract = $('#contract_display');
  const $edit = $('#contract_edit');
  $.get('/widgetContractText/' + WIDGET_UNIQUE_ID, function (data) {
    $contract.html(data.contract);
    const texts = data.texts;
    const $saveButton    = $('[name=save]');
    const $restoreButton = $('[name=restore]');
    $saveButton.click(function () {
      const textareaList = [].slice.call($edit.find(INPUT_TAG), null);
      const texts = textareaList.reduce((res, {name, value}) => {
        res[name] = value;
        return res;
      }, {});
      $.ajax(`/contract/${WIDGET_ID}`, {
        method:  'PUT',
        contentType: 'application/json',
        data:    JSON.stringify(texts),
        success: function (data) {
          window.location.reload()
        }
      })
    });
    $restoreButton.click(function () {
      $.post({
        url:     '/contract/restore/' + WIDGET_ID,
        success: function () {
          window.location.reload()
        }
      })
    });

    //Render & attach contact text & actions
    for (const key in texts) {
      if (texts.hasOwnProperty(key)) {
        const $controller = createController(key, texts[key]);
        $controller.addClass(`${HIDDEN}`);
        $edit.append($controller);
      }
    }
    $edit.on({
      'click': ({ target }) => {
        const $target = $(target);
        const { dataset } = target;
        const isButton = !!dataset && dataset.role;
        if (isButton) itemActions(dataset, $target);
      },
      'input': ({ target }) => {
        const { value, name } = target;
        const parsedValue = value
          .replace(/{CITY}/g, EMPTY_DATA_FILLER_LONG)
          .replace(/{DAY}/g, EMPTY_DATA_FILLER)
          .replace(/{MONTH}/g, EMPTY_DATA_FILLER_LONG)
          .replace(/{YEAR}/g, YEAR)
          .replace(/{NAME}/g, EMPTY_DATA_FILLER_LONG)
          .replace(/{DESCRIPTION}/g, EMPTY_DATA_FILLER_LONG)
          .replace(/{SOCIAL_NUMBER}/g, EMPTY_DATA_FILLER_LONG)
          .replace(/{PRICE}/g, EMPTY_DATA_FILLER)
          .replace(/{PRICE_ESTIMATED}/g, EMPTY_DATA_FILLER)
          .replace(/{PDFO}/g, EMPTY_DATA_FILLER)
          .replace(/{MILITARY}/g, EMPTY_DATA_FILLER)
          .replace(/{PRODUCT_NAME}/g, EMPTY_DATA_FILLER_LONG)
          .replace(/{PRODUCT_IMEI}/g, EMPTY_DATA_FILLER_LONG)
          .replace(/{PASSPORT_SERIA}/g, EMPTY_DATA_FILLER)
          .replace(/{PASSPORT_NUMBER}/g, EMPTY_DATA_FILLER_LONG)
          .replace(/{PASSPORT_GIVEN_BY}/g, EMPTY_DATA_FILLER_LONG)
          .replace(/{PASSPORT_GIVEN_DATE}/g, EMPTY_DATA_FILLER_LONG)
          .replace(/{ADDRESS}/g, EMPTY_DATA_FILLER_LONG)
          .replace(/{PHONE}/g, EMPTY_DATA_FILLER_LONG)
        $(`#${name}`).html(parsedValue);
      },
    });
    $contract.on('click', `.${TEXT_BLOCK}`, ({ currentTarget }) => {
      const $targetController = $(`[name="${currentTarget.id}"]`);
      const $currentTarget = $(currentTarget);
      $currentTarget.siblings(`.${TEXT_BLOCK}`).removeClass(ACTIVE);
      $currentTarget.toggleClass(ACTIVE);
      const isActive = $currentTarget.hasClass(ACTIVE);
      $edit.find(`.${CONTROLLER_WRAPPER}`).addClass(`${HIDDEN}`);
      if (isActive) {
        $targetController
          .parent(`.${CONTROLLER_WRAPPER}`)
          .removeClass(`${HIDDEN}`);
        $targetController.trigger('focus')
      }
    });
    function generateID() {
      return`${ITEM_PREFIX}${Date.now()}`;
    }
    function closeActiveEditor($controller, $targetItem) {
      $controller.addClass(`${HIDDEN}`);
      $targetItem.removeClass(ACTIVE);
    }
    function createController(itemID, value) {
      return $(`<div class="${CONTROLLER_WRAPPER}">
        <${INPUT_TAG} name="${itemID}" rows="10" cols="45">${value}</${INPUT_TAG}>
        <div class="item-control">
          <button class="fa fa-close" data-role="${CLOSE}" data-ref="${itemID}"></button>
          <button class="fa fa-plus-circle" data-role="${ADD_ITEM}" data-ref="${itemID}"></button>
          <button class="fa fa-trash" data-role="${REMOVE_ITEM}" data-ref="${itemID}"></button>
        </div>
      </div>`);
    }
    function itemActions({role, ref}, $target) {
      const $controller = $target.parents(`.${CONTROLLER_WRAPPER}`);
      const ITEM_TEXT = 'Текст';
      const $targetItem = $(`#${ref}`);
      switch (role) {
        case CLOSE:
          closeActiveEditor($controller, $targetItem);
          break;
        case ADD_ITEM:
          const itemID = generateID();
          const $controllerNew = createController(itemID, ITEM_TEXT);
          closeActiveEditor($controller, $targetItem);
          $targetItem.after(`<div id="${itemID}" class="${TEXT_BLOCK} ${ACTIVE}">${ITEM_TEXT}</div>`);
          $controller.after($controllerNew);
          $controllerNew.find(`${INPUT_TAG}`).trigger('focus');
          break;
        case REMOVE_ITEM:
          $controller.remove();
          $targetItem.remove();
          break;
      }
    }
  });
}));
