String.prototype.toTitleCase = function() {
  var i, j, str, lowers, uppers;
  str = this.split('-').join(' ').replace(/([^\W_]+[^\s-]*) */g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });

  // Certain minor words should be left lowercase unless
  // they are the first or last words in the string
  lowers = ['A', 'An', 'The', 'And', 'But', 'Or', 'For', 'Nor', 'As', 'At',
  'By', 'For', 'From', 'In', 'Into', 'Near', 'Of', 'On', 'Onto', 'To', 'With'];
  for (i = 0, j = lowers.length; i < j; i++)
    str = str.replace(new RegExp('\\s' + lowers[i] + '\\s', 'g'),
      function(txt) {
        return txt.toLowerCase();
      });

  // Certain words such as initialisms or acronyms should be left uppercase
  uppers = ['Id', 'Tv'];
  for (i = 0, j = uppers.length; i < j; i++)
    str = str.replace(new RegExp('\\b' + uppers[i] + '\\b', 'g'),
      uppers[i].toUpperCase());

  return str;
};

// function load_comparable_datasets(dataset_name){
//   $.ajax({type: "GET",
//       url: "/compare/load_comparable_datasets/" + dataset_name,
//       success: function (data) {
//         data = JSON.parse(data)
//         $('#datasets_to_compare_with').html('')
//         $('#datasets_to_compare_with').html($(data.html));
//         $compare_with_select = $("select#compare_with")
//         matches = data.matches
//         main_geo_type = data.main_geo_type
//         comparable = data.comparable
//       }
// });
