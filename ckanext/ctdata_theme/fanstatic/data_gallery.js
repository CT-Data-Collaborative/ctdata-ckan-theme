$(function(){

  $('div.domain').hide();
  $('div.domain#most_recent').show();

  $('ul.nav_links').find('a').on('click', function(){
    id = $(this).attr('id')
    $('ul.nav_links').find('a[id!="' + id + '"]').removeClass('dark_blue')
    $(this).addClass('dark_blue')
    $('div.domain[id!="' + id + '"]').hide();
    $('div.domain#' + id ).show();
  });


});
