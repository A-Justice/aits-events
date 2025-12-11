/**
 * This JS file was auto-generated via Terser.
 *
 * Contributors should avoid editing this file, but instead edit the associated
 * non minified file file. For more information, check out our engineering docs
 * on how we handle JS minification in our engineering docs.
 *
 * @see: https://evnt.is/dev-docs-minification
 */

var tribe_attendees_list={};!function(window,document,$,my){my.selector={container:".tribe-attendees-list-container",title:".tribe-attendees-list-title",list:".tribe-attendees-list",items:".tribe-attendees-list-item",hidden:".tribe-attendees-list-hidden",shown:".tribe-attendees-list-shown",showall:".tribe-attendees-list-showall"},my.init=function(){$(my.selector.showall).on("click",my.toggle_items)},my.toggle_items=function(event){event.preventDefault();$(this).parents(my.selector.container).toggleClass("tribe-attendees-list-showjs")},$(my.init)}(window,document,jQuery,tribe_attendees_list);