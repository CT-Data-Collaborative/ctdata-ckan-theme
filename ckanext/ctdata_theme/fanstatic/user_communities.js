var ids_to_remove = [],
    names_hash = {};

$(function(){
  $('.remove_profile').on('click', function(){
    ids_to_remove.push( $(this).attr('id'));

    $(this).closest('tr').hide();
  });

  $('.edit_name').click( function(){
    $(this).hide();
    $(this).closest('td').find('input.edit_profile_name').removeClass('hidden');
  })

  $('input.edit_profile_name').on('change', function(){
    names_hash[$(this).attr('id')] = $(this).val();
  });

  $('#update_user_communities').on('click', function(){
    $.ajax({type: "POST",
      url: "/update_community_profiles",
      data: JSON.stringify({ names_hash: names_hash,
                             profiles_to_remove: ids_to_remove}),
      contentType: 'application/json; charset=utf-8',
      success: function (data) {
        window.location.reload();
      }
    });

  })

});