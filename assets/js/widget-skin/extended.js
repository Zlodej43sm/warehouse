$(function() {
  'use strict';

  const $accordionToggle = $('[data-type="accordion-toggle"]');
  const collapseClass = 'collapse';
  const accordion = '[data-type="accordion"]';
  const accordionContent = '[data-type="accordion-content"]';

  $accordionToggle.on('click', ({currentTarget, preventDefault}) => {
    $(currentTarget).parent(accordion).toggleClass(collapseClass);
    preventDefault();
  });
});
