'use strict';
/* global $ */

/**
 * A module for managing multiple days & application state.
 * Days are held in a `days` array, with a reference to the `currentDay`.
 * Clicking the "add" (+) button builds a new day object (see `day.js`)
 * and switches to displaying it. Clicking the "remove" button (x) performs
 * the relatively involved logic of reassigning all day numbers and splicing
 * the day out of the collection.
 *
 * This module has four public methods: `.load()`, which currently just
 * adds a single day (assuming a priori no days); `switchTo`, which manages
 * hiding and showing the proper days; and `addToCurrent`/`removeFromCurrent`,
 * which take `attraction` objects and pass them to `currentDay`.
 */

var daysModule = (function () {

  // application state

  var days = [],
      currentDay;

  // jQuery selections

  var $addButton, $removeButton;
  $(function () {
    $addButton = $('#day-add');
    $removeButton = $('#day-title > button.remove');
  });

  // method used both internally and externally

  function switchTo (newCurrentDay) {
    currentDay.hide();
    currentDay = newCurrentDay;
    currentDay.show();
  }

  // jQuery event binding

  $(function () {
    $addButton.on('click', addDay);
    $removeButton.on('click', deleteCurrentDay);
  });

  function addDay (click,day) {
    $addButton.prop('disabled',true);
    if (this && this.blur) this.blur(); // removes focus box from buttons
    if (!day) {
      $.post('/api/days/addDay',{number: days.length+1})
      .done(function (createdDay) {
        var newDay = dayModule.create(createdDay);
        days.push(newDay);
        if (days.length === 1) {
          currentDay = newDay;
          switchTo(currentDay);
        }
        $addButton.prop('disabled',false);
      })
      .fail(console.error.bind(console));
    } else {
      var newDay = dayModule.create(day);
      if (day.hotel) {
        newDay.hotel = attractionsModule.create(day.hotel);
      }
      newDay.restaurant = day.restaurant.map(function(rest) {
        return attractionsModule.create(rest);
      });
      newDay.activity = day.activity.map(function(act) {
        return attractionsModule.create(act);
      });
      days.push(newDay);
      if (days.length === 1) {
        currentDay = newDay;
        switchTo(currentDay);
      }
      $addButton.prop('disabled',false);
    }
  }

  function deleteCurrentDay () {
    $removeButton.prop('disabled',true);
    debugger;
    // prevent deleting last day
    if (days.length < 2 || !currentDay) return;
    // remove from the collection
    var index = days.indexOf(currentDay),
      previousDay = days.splice(index, 1)[0],
      newCurrent = days[index] || days[index - 1];
    $.ajax({
      method: 'DELETE',
      url: '/api/days/deleteDay',
      data: {number: previousDay.number}
    })
    .done(function () {
      // fix the remaining day numbers
      days.forEach(function (day, i) {
        day.setNumber(i + 1);
      });
      switchTo(newCurrent);
      previousDay.hideButton();
      $removeButton.prop('disabled',false);
    })
    .fail(console.error.bind(console));
  }

  function load () {
    $.get('/api/days/')
    .done(function (dayArr) {
      if (dayArr.length === 0) {
        addDay();
      } else {
        dayArr.forEach(function (day) {
          addDay(null,day);
        }); 
      }
    });
  }

  // globally accessible module methods

  var methods = {

    load: load,

    switchTo: switchTo,

    addToCurrent: function (attraction) {
      currentDay.addAttraction(attraction);
    },

    removeFromCurrent: function (attraction) {
      currentDay.removeAttraction(attraction);
    }

  };

  return methods;

}());