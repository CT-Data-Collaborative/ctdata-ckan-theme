var $main_dataset_select = $("select#dataset_name"),
    $compare_with_select = $("select#compare_with"),
    matches              = {},
    x_axe_name           = "Value"
    y_axe_name           = "Town"
    main_geo_type        = "",
    mark_type            = "symbol",
    color                = 'data.Variable',
    shape                = 'data.shape',
    size                 = 'data.size',
    min                  = 0,
    max                  = 200000,
    x_dim                = "data.Value",
    y_dim                = "data.location_name",
    default_color        = 'blue',
    default_size         = 50
    comparable           = [];
    // data_items           = [];

var data_items = JSON.parse(
  '{"max": 99.7, "data": [{"Town": "Andover", "x": 0, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.2, "label": "2.2", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Andover"}, {"Town": "Ansonia", "x": 1, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 8.6, "label": "8.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Ansonia"}, {"Town": "Ashford", "x": 2, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.9, "label": "2.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Ashford"}, {"Town": "Avon", "x": 3, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.5, "label": "3.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Avon"}, {"Town": "Barkhamsted", "x": 4, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Barkhamsted"}, {"Town": "Beacon Falls", "x": 5, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.5, "label": "4.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Beacon Falls"}, {"Town": "Berlin", "x": 6, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.8, "label": "3.8", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Berlin"}, {"Town": "Bethany", "x": 7, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.6, "label": "2.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Bethany"}, {"Town": "Bethel", "x": 8, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.0, "label": "4", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Bethel"}, {"Town": "Bethlehem", "x": 9, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.5, "label": "3.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Bethlehem"}, {"Town": "Bloomfield", "x": 10, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.5, "label": "3.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Bloomfield"}, {"Town": "Bolton", "x": 11, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.8, "label": "6.8", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Bolton"}, {"Town": "Bozrah", "x": 12, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.8, "label": "4.8", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Bozrah"}, {"Town": "Branford", "x": 13, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.1, "label": "6.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Branford"}, {"Town": "Bridgeport", "x": 14, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 15.4, "label": "15.4", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Bridgeport"}, {"Town": "Bridgewater", "x": 15, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.1, "label": "7.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Bridgewater"}, {"Town": "Bristol", "x": 16, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 9.9, "label": "9.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Bristol"}, {"Town": "Brookfield", "x": 17, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.6, "label": "4.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Brookfield"}, {"Town": "Brooklyn", "x": 18, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.9, "label": "6.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Brooklyn"}, {"Town": "Burlington", "x": 19, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.5, "label": "3.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Burlington"}, {"Town": "Canaan", "x": 20, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Canaan"}, {"Town": "Canterbury", "x": 21, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.4, "label": "2.4", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Canterbury"}, {"Town": "Canton", "x": 22, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.2, "label": "2.2", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Canton"}, {"Town": "Chaplin", "x": 23, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 9.1, "label": "9.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Chaplin"}, {"Town": "Cheshire", "x": 24, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.0, "label": "4", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Cheshire"}, {"Town": "Chester", "x": 25, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.2, "label": "2.2", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Chester"}, {"Town": "Clinton", "x": 26, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.0, "label": "3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Clinton"}, {"Town": "Colchester", "x": 27, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.9, "label": "0.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Colchester"}, {"Town": "Colebrook", "x": 28, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Colebrook"}, {"Town": "Columbia", "x": 29, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.3, "label": "3.3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Columbia"}, {"Town": "Cornwall", "x": 30, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.7, "label": "7.7", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Cornwall"}, {"Town": "Coventry", "x": 31, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.1, "label": "4.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Coventry"}, {"Town": "Cromwell", "x": 32, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.6, "label": "7.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Cromwell"}, {"Town": "Danbury", "x": 33, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.2, "label": "5.2", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Danbury"}, {"Town": "Darien", "x": 34, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.8, "label": "1.8", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Darien"}, {"Town": "Deep River", "x": 35, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.1, "label": "4.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Deep River"}, {"Town": "Derby", "x": 36, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 11.9, "label": "11.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Derby"}, {"Town": "Durham", "x": 37, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.3, "label": "1.3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Durham"}, {"Town": "East Granby", "x": 38, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.0, "label": "3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "East Granby"}, {"Town": "East Haddam", "x": 39, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.5, "label": "4.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "East Haddam"}, {"Town": "East Hampton", "x": 40, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.5, "label": "2.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "East Hampton"}, {"Town": "East Hartford", "x": 41, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 13.4, "label": "13.4", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "East Hartford"}, {"Town": "East Haven", "x": 42, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.7, "label": "6.7", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "East Haven"}, {"Town": "East Lyme", "x": 43, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.5, "label": "2.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "East Lyme"}, {"Town": "East Windsor", "x": 44, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.8, "label": "2.8", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "East Windsor"}, {"Town": "Eastford", "x": 45, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 9.1, "label": "9.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Eastford"}, {"Town": "Easton", "x": 46, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.6, "label": "1.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Easton"}, {"Town": "Ellington", "x": 47, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.0, "label": "3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Ellington"}, {"Town": "Enfield", "x": 48, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.0, "label": "5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Enfield"}, {"Town": "Essex", "x": 49, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.5, "label": "2.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Essex"}, {"Town": "Fairfield", "x": 50, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.8, "label": "2.8", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Fairfield"}, {"Town": "Farmington", "x": 51, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.9, "label": "1.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Farmington"}, {"Town": "Franklin", "x": 52, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Franklin"}, {"Town": "Glastonbury", "x": 53, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.3, "label": "1.3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Glastonbury"}, {"Town": "Granby", "x": 54, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.9, "label": "1.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Granby"}, {"Town": "Greenwich", "x": 55, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.6, "label": "4.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Greenwich"}, {"Town": "Griswold", "x": 56, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.4, "label": "6.4", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Griswold"}, {"Town": "Groton", "x": 57, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.2, "label": "4.2", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Groton"}, {"Town": "Guilford", "x": 58, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.1, "label": "3.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Guilford"}, {"Town": "Haddam", "x": 59, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.0, "label": "3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Haddam"}, {"Town": "Hamden", "x": 60, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.6, "label": "2.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Hamden"}, {"Town": "Hampton", "x": 61, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.3, "label": "5.3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Hampton"}, {"Town": "Hartford", "x": 62, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 15.0, "label": "15", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Hartford"}, {"Town": "Hartland", "x": 63, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.5, "label": "4.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Hartland"}, {"Town": "Harwinton", "x": 64, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.5, "label": "3.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Harwinton"}, {"Town": "Hebron", "x": 65, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.2, "label": "3.2", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Hebron"}, {"Town": "Kent", "x": 66, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.1, "label": "3.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Kent"}, {"Town": "Killingly", "x": 67, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.1, "label": "7.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Killingly"}, {"Town": "Killingworth", "x": 68, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.0, "label": "3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Killingworth"}, {"Town": "Lebanon", "x": 69, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.9, "label": "5.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Lebanon"}, {"Town": "Ledyard", "x": 70, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.9, "label": "4.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Ledyard"}, {"Town": "Lisbon", "x": 71, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Lisbon"}, {"Town": "Litchfield", "x": 72, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.1, "label": "5.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Litchfield"}, {"Town": "Lyme", "x": 73, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 11.0, "label": "11", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Lyme"}, {"Town": "Madison", "x": 74, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.8, "label": "0.8", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Madison"}, {"Town": "Manchester", "x": 75, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.7, "label": "5.7", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Manchester"}, {"Town": "Mansfield", "x": 76, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.3, "label": "2.3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Mansfield"}, {"Town": "Marlborough", "x": 77, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.2, "label": "2.2", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Marlborough"}, {"Town": "Meriden", "x": 78, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.7, "label": "2.7", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Meriden"}, {"Town": "Middlebury", "x": 79, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.8, "label": "4.8", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Middlebury"}, {"Town": "Middlefield", "x": 80, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.3, "label": "1.3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Middlefield"}, {"Town": "Middletown", "x": 81, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.2, "label": "5.2", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Middletown"}, {"Town": "Milford", "x": 82, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.2, "label": "2.2", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Milford"}, {"Town": "Monroe", "x": 83, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.8, "label": "1.8", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Monroe"}, {"Town": "Montville", "x": 84, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.6, "label": "6.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Montville"}, {"Town": "Naugatuck", "x": 85, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.3, "label": "6.3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Naugatuck"}, {"Town": "New Britain", "x": 86, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 13.0, "label": "13", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "New Britain"}, {"Town": "New Canaan", "x": 87, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.3, "label": "3.3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "New Canaan"}, {"Town": "New Fairfield", "x": 88, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.6, "label": "3.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "New Fairfield"}, {"Town": "New Hartford", "x": 89, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 8.0, "label": "8", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "New Hartford"}, {"Town": "New Haven", "x": 90, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 17.9, "label": "17.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "New Haven"}, {"Town": "New London", "x": 91, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 18.5, "label": "18.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "New London"}, {"Town": "New Milford", "x": 92, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.1, "label": "3.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "New Milford"}, {"Town": "Newington", "x": 93, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.3, "label": "2.3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Newington"}, {"Town": "Newtown", "x": 94, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.7, "label": "3.7", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Newtown"}, {"Town": "Norfolk", "x": 95, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.2, "label": "6.2", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Norfolk"}, {"Town": "North Branford", "x": 96, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "North Branford"}, {"Town": "North Canaan", "x": 97, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.1, "label": "7.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "North Canaan"}, {"Town": "North Haven", "x": 98, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.3, "label": "3.3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "North Haven"}, {"Town": "North Stonington", "x": 99, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.9, "label": "3.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "North Stonington"}, {"Town": "Norwalk", "x": 100, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.4, "label": "5.4", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Norwalk"}, {"Town": "Norwich", "x": 101, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.6, "label": "7.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Norwich"}, {"Town": "Old Lyme", "x": 102, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 11.0, "label": "11", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Old Lyme"}, {"Town": "Old Saybrook", "x": 103, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Old Saybrook"}, {"Town": "Orange", "x": 104, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.6, "label": "1.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Orange"}, {"Town": "Oxford", "x": 105, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.3, "label": "7.3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Oxford"}, {"Town": "Plainfield", "x": 106, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.9, "label": "6.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Plainfield"}, {"Town": "Plainville", "x": 107, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.9, "label": "2.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Plainville"}, {"Town": "Plymouth", "x": 108, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.5, "label": "4.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Plymouth"}, {"Town": "Pomfret", "x": 109, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Pomfret"}, {"Town": "Portland", "x": 110, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.6, "label": "2.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Portland"}, {"Town": "Preston", "x": 111, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.9, "label": "5.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Preston"}, {"Town": "Prospect", "x": 112, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.5, "label": "4.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Prospect"}, {"Town": "Putnam", "x": 113, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 12.2, "label": "12.2", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Putnam"}, {"Town": "Redding", "x": 114, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.3, "label": "3.3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Redding"}, {"Town": "Ridgefield", "x": 115, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 8.2, "label": "8.2", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Ridgefield"}, {"Town": "Rocky Hill", "x": 116, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.6, "label": "4.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Rocky Hill"}, {"Town": "Roxbury", "x": 117, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.1, "label": "7.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Roxbury"}, {"Town": "Salem", "x": 118, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.5, "label": "2.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Salem"}, {"Town": "Salisbury", "x": 119, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.4, "label": "5.4", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Salisbury"}, {"Town": "Scotland", "x": 120, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Scotland"}, {"Town": "Seymour", "x": 121, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.2, "label": "2.2", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Seymour"}, {"Town": "Sharon", "x": 122, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Sharon"}, {"Town": "Shelton", "x": 123, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.7, "label": "5.7", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Shelton"}, {"Town": "Sherman", "x": 124, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 8.6, "label": "8.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Sherman"}, {"Town": "Simsbury", "x": 125, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.5, "label": "3.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Simsbury"}, {"Town": "Somers", "x": 126, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.8, "label": "1.8", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Somers"}, {"Town": "South Windsor", "x": 127, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 16.0, "label": "16", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "South Windsor"}, {"Town": "Southbury", "x": 128, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.8, "label": "4.8", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Southbury"}, {"Town": "Southington", "x": 129, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.1, "label": "3.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Southington"}, {"Town": "Sprague", "x": 130, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.6, "label": "2.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Sprague"}, {"Town": "Stafford", "x": 131, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 8.0, "label": "8", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Stafford"}, {"Town": "Stamford", "x": 132, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.6, "label": "7.6", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Stamford"}, {"Town": "Sterling", "x": 133, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.1, "label": "7.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Sterling"}, {"Town": "Stonington", "x": 134, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.7, "label": "6.7", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Stonington"}, {"Town": "Stratford", "x": 135, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.1, "label": "6.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Stratford"}, {"Town": "Suffield", "x": 136, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.1, "label": "2.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Suffield"}, {"Town": "Thomaston", "x": 137, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.1, "label": "5.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Thomaston"}, {"Town": "Thompson", "x": 138, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 8.9, "label": "8.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Thompson"}, {"Town": "Tolland", "x": 139, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.0, "label": "3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Tolland"}, {"Town": "Torrington", "x": 140, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.4, "label": "6.4", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Torrington"}, {"Town": "Trumbull", "x": 141, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 13.1, "label": "13.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Trumbull"}, {"Town": "Union", "x": 142, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Union"}, {"Town": "Vernon", "x": 143, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.3, "label": "4.3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Vernon"}, {"Town": "Voluntown", "x": 144, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.4, "label": "3.4", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Voluntown"}, {"Town": "Wallingford", "x": 145, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.5, "label": "5.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Wallingford"}, {"Town": "Washington", "x": 146, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.1, "label": "7.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Washington"}, {"Town": "Waterbury", "x": 147, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.0, "label": "5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Waterbury"}, {"Town": "Waterford", "x": 148, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.5, "label": "3.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Waterford"}, {"Town": "Watertown", "x": 149, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.2, "label": "2.2", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Watertown"}, {"Town": "West Hartford", "x": 150, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.0, "label": "3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "West Hartford"}, {"Town": "West Haven", "x": 151, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 9.7, "label": "9.7", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "West Haven"}, {"Town": "Westbrook", "x": 152, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.4, "label": "5.4", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Westbrook"}, {"Town": "Weston", "x": 153, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.9, "label": "6.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Weston"}, {"Town": "Westport", "x": 154, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.9, "label": "2.9", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Westport"}, {"Town": "Wethersfield", "x": 155, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.1, "label": "1.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Wethersfield"}, {"Town": "Willington", "x": 156, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.7, "label": "5.7", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Willington"}, {"Town": "Wilton", "x": 157, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.1, "label": "3.1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Wilton"}, {"Town": "Winchester", "x": 158, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.3, "label": "6.3", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Winchester"}, {"Town": "Windham", "x": 159, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 11.8, "label": "11.8", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Windham"}, {"Town": "Windsor", "x": 160, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.7, "label": "2.7", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Windsor"}, {"Town": "Windsor Locks", "x": 161, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.8, "label": "0.8", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Windsor Locks"}, {"Town": "Wolcott", "x": 162, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.5, "label": "1.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Wolcott"}, {"Town": "Woodbridge", "x": 163, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.4, "label": "4.4", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Woodbridge"}, {"Town": "Woodbury", "x": 164, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.5, "label": "3.5", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Woodbury"}, {"Town": "Woodstock", "x": 165, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.0, "label": "1", "Year": "2009", "Variable": "Students absent 20 or more days", "location_name": "Woodstock"}, {"Town": "Andover", "x": 0, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 8.7, "label": "8.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Andover"}, {"Town": "Ansonia", "x": 1, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 63.1, "label": "63.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Ansonia"}, {"Town": "Ashford", "x": 2, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 17.1, "label": "17.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Ashford"}, {"Town": "Avon", "x": 3, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.1, "label": "5.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Avon"}, {"Town": "Barkhamsted", "x": 4, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.3, "label": "5.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Barkhamsted"}, {"Town": "Beacon Falls", "x": 5, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.1, "label": "7.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Beacon Falls"}, {"Town": "Berlin", "x": 6, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.7, "label": "7.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Berlin"}, {"Town": "Bethany", "x": 7, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.3, "label": "1.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Bethany"}, {"Town": "Bethel", "x": 8, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 10.2, "label": "10.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Bethel"}, {"Town": "Bethlehem", "x": 9, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 9.7, "label": "9.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Bethlehem"}, {"Town": "Bloomfield", "x": 10, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 40.1, "label": "40.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Bloomfield"}, {"Town": "Bolton", "x": 11, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 15.9, "label": "15.9", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Bolton"}, {"Town": "Bozrah", "x": 12, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 9.5, "label": "9.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Bozrah"}, {"Town": "Branford", "x": 13, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 20.7, "label": "20.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Branford"}, {"Town": "Bridgeport", "x": 14, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 99.7, "label": "99.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Bridgeport"}, {"Town": "Bridgewater", "x": 15, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.6, "label": "3.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Bridgewater"}, {"Town": "Bristol", "x": 16, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 42.5, "label": "42.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Bristol"}, {"Town": "Brookfield", "x": 17, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.6, "label": "4.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Brookfield"}, {"Town": "Brooklyn", "x": 18, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 20.8, "label": "20.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Brooklyn"}, {"Town": "Burlington", "x": 19, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.9, "label": "2.9", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Burlington"}, {"Town": "Canaan", "x": 20, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 10.0, "label": "10", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Canaan"}, {"Town": "Canterbury", "x": 21, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 25.3, "label": "25.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Canterbury"}, {"Town": "Canton", "x": 22, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.5, "label": "1.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Canton"}, {"Town": "Chaplin", "x": 23, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 22.7, "label": "22.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Chaplin"}, {"Town": "Cheshire", "x": 24, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.3, "label": "4.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Cheshire"}, {"Town": "Chester", "x": 25, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.3, "label": "4.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Chester"}, {"Town": "Clinton", "x": 26, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 13.7, "label": "13.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Clinton"}, {"Town": "Colchester", "x": 27, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 11.1, "label": "11.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Colchester"}, {"Town": "Colebrook", "x": 28, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Colebrook"}, {"Town": "Columbia", "x": 29, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.8, "label": "4.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Columbia"}, {"Town": "Cornwall", "x": 30, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Cornwall"}, {"Town": "Coventry", "x": 31, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 11.6, "label": "11.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Coventry"}, {"Town": "Cromwell", "x": 32, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 10.3, "label": "10.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Cromwell"}, {"Town": "Danbury", "x": 33, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 36.2, "label": "36.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Danbury"}, {"Town": "Darien", "x": 34, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.8, "label": "0.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Darien"}, {"Town": "Deep River", "x": 35, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 8.2, "label": "8.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Deep River"}, {"Town": "Derby", "x": 36, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 45.5, "label": "45.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Derby"}, {"Town": "Durham", "x": 37, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.6, "label": "2.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Durham"}, {"Town": "East Granby", "x": 38, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.0, "label": "3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "East Granby"}, {"Town": "East Haddam", "x": 39, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 9.9, "label": "9.9", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "East Haddam"}, {"Town": "East Hampton", "x": 40, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.7, "label": "5.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "East Hampton"}, {"Town": "East Hartford", "x": 41, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 65.6, "label": "65.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "East Hartford"}, {"Town": "East Haven", "x": 42, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 43.3, "label": "43.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "East Haven"}, {"Town": "East Lyme", "x": 43, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 11.5, "label": "11.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "East Lyme"}, {"Town": "East Windsor", "x": 44, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 26.2, "label": "26.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "East Windsor"}, {"Town": "Eastford", "x": 45, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Eastford"}, {"Town": "Easton", "x": 46, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.6, "label": "1.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Easton"}, {"Town": "Ellington", "x": 47, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 9.5, "label": "9.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Ellington"}, {"Town": "Enfield", "x": 48, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 33.3, "label": "33.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Enfield"}, {"Town": "Essex", "x": 49, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.6, "label": "7.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Essex"}, {"Town": "Fairfield", "x": 50, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.1, "label": "5.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Fairfield"}, {"Town": "Farmington", "x": 51, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.4, "label": "6.4", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Farmington"}, {"Town": "Franklin", "x": 52, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 10.0, "label": "10", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Franklin"}, {"Town": "Glastonbury", "x": 53, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.0, "label": "6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Glastonbury"}, {"Town": "Goshen", "x": 54, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.8, "label": "6.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Goshen"}, {"Town": "Granby", "x": 55, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.2, "label": "3.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Granby"}, {"Town": "Greenwich", "x": 56, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 11.0, "label": "11", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Greenwich"}, {"Town": "Griswold", "x": 57, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 35.7, "label": "35.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Griswold"}, {"Town": "Groton", "x": 58, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 32.2, "label": "32.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Groton"}, {"Town": "Guilford", "x": 59, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.6, "label": "6.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Guilford"}, {"Town": "Haddam", "x": 60, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.9, "label": "3.9", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Haddam"}, {"Town": "Hamden", "x": 61, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 40.1, "label": "40.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Hamden"}, {"Town": "Hampton", "x": 62, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 10.5, "label": "10.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Hampton"}, {"Town": "Hartford", "x": 63, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 94.8, "label": "94.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Hartford"}, {"Town": "Hartland", "x": 64, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Hartland"}, {"Town": "Harwinton", "x": 65, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.9, "label": "2.9", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Harwinton"}, {"Town": "Hebron", "x": 66, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.2, "label": "5.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Hebron"}, {"Town": "Kent", "x": 67, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 12.5, "label": "12.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Kent"}, {"Town": "Killingly", "x": 68, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 39.8, "label": "39.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Killingly"}, {"Town": "Killingworth", "x": 69, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.9, "label": "3.9", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Killingworth"}, {"Town": "Lebanon", "x": 70, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 14.3, "label": "14.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Lebanon"}, {"Town": "Ledyard", "x": 71, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.4, "label": "7.4", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Ledyard"}, {"Town": "Lisbon", "x": 72, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 13.2, "label": "13.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Lisbon"}, {"Town": "Litchfield", "x": 73, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.8, "label": "3.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Litchfield"}, {"Town": "Lyme", "x": 74, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 10.1, "label": "10.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Lyme"}, {"Town": "Madison", "x": 75, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.7, "label": "3.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Madison"}, {"Town": "Manchester", "x": 76, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 45.5, "label": "45.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Manchester"}, {"Town": "Mansfield", "x": 77, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 19.2, "label": "19.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Mansfield"}, {"Town": "Marlborough", "x": 78, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.6, "label": "5.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Marlborough"}, {"Town": "Meriden", "x": 79, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 70.2, "label": "70.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Meriden"}, {"Town": "Middlebury", "x": 80, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.1, "label": "2.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Middlebury"}, {"Town": "Middlefield", "x": 81, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.6, "label": "2.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Middlefield"}, {"Town": "Middletown", "x": 82, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 36.7, "label": "36.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Middletown"}, {"Town": "Milford", "x": 83, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 15.2, "label": "15.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Milford"}, {"Town": "Monroe", "x": 84, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.1, "label": "3.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Monroe"}, {"Town": "Montville", "x": 85, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 26.4, "label": "26.4", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Montville"}, {"Town": "Morris", "x": 86, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.8, "label": "6.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Morris"}, {"Town": "Naugatuck", "x": 87, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 34.7, "label": "34.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Naugatuck"}, {"Town": "New Britain", "x": 88, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 74.3, "label": "74.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "New Britain"}, {"Town": "New Canaan", "x": 89, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "New Canaan"}, {"Town": "New Fairfield", "x": 90, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.6, "label": "6.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "New Fairfield"}, {"Town": "New Hartford", "x": 91, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.5, "label": "4.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "New Hartford"}, {"Town": "New Haven", "x": 92, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 78.4, "label": "78.4", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "New Haven"}, {"Town": "New London", "x": 93, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 59.7, "label": "59.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "New London"}, {"Town": "New Milford", "x": 94, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 11.1, "label": "11.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "New Milford"}, {"Town": "Newington", "x": 95, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 15.3, "label": "15.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Newington"}, {"Town": "Newtown", "x": 96, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.5, "label": "3.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Newtown"}, {"Town": "Norfolk", "x": 97, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 12.5, "label": "12.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Norfolk"}, {"Town": "North Branford", "x": 98, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.1, "label": "7.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "North Branford"}, {"Town": "North Canaan", "x": 99, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 21.4, "label": "21.4", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "North Canaan"}, {"Town": "North Haven", "x": 100, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 11.4, "label": "11.4", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "North Haven"}, {"Town": "North Stonington", "x": 101, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 13.7, "label": "13.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "North Stonington"}, {"Town": "Norwalk", "x": 102, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 38.5, "label": "38.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Norwalk"}, {"Town": "Norwich", "x": 103, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 65.7, "label": "65.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Norwich"}, {"Town": "Old Lyme", "x": 104, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 10.1, "label": "10.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Old Lyme"}, {"Town": "Old Saybrook", "x": 105, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 10.7, "label": "10.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Old Saybrook"}, {"Town": "Orange", "x": 106, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 4.4, "label": "4.4", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Orange"}, {"Town": "Oxford", "x": 107, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.0, "label": "5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Oxford"}, {"Town": "Plainfield", "x": 108, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 34.7, "label": "34.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Plainfield"}, {"Town": "Plainville", "x": 109, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 19.5, "label": "19.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Plainville"}, {"Town": "Plymouth", "x": 110, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 24.8, "label": "24.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Plymouth"}, {"Town": "Pomfret", "x": 111, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 10.7, "label": "10.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Pomfret"}, {"Town": "Portland", "x": 112, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 12.8, "label": "12.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Portland"}, {"Town": "Preston", "x": 113, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 9.8, "label": "9.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Preston"}, {"Town": "Prospect", "x": 114, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 7.1, "label": "7.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Prospect"}, {"Town": "Putnam", "x": 115, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 57.8, "label": "57.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Putnam"}, {"Town": "Redding", "x": 116, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 1.7, "label": "1.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Redding"}, {"Town": "Ridgefield", "x": 117, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.5, "label": "0.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Ridgefield"}, {"Town": "Rocky Hill", "x": 118, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.7, "label": "6.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Rocky Hill"}, {"Town": "Roxbury", "x": 119, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.6, "label": "3.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Roxbury"}, {"Town": "Salem", "x": 120, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.5, "label": "2.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Salem"}, {"Town": "Salisbury", "x": 121, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.4, "label": "5.4", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Salisbury"}, {"Town": "Scotland", "x": 122, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 25.0, "label": "25", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Scotland"}, {"Town": "Seymour", "x": 123, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 19.7, "label": "19.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Seymour"}, {"Town": "Sharon", "x": 124, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 22.2, "label": "22.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Sharon"}, {"Town": "Shelton", "x": 125, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 13.2, "label": "13.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Shelton"}, {"Town": "Sherman", "x": 126, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.6, "label": "5.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Sherman"}, {"Town": "Simsbury", "x": 127, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.0, "label": "5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Simsbury"}, {"Town": "Somers", "x": 128, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 5.3, "label": "5.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Somers"}, {"Town": "South Windsor", "x": 129, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 8.3, "label": "8.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "South Windsor"}, {"Town": "Southbury", "x": 130, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.1, "label": "2.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Southbury"}, {"Town": "Southington", "x": 131, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 8.0, "label": "8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Southington"}, {"Town": "Sprague", "x": 132, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 38.5, "label": "38.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Sprague"}, {"Town": "Stafford", "x": 133, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 29.1, "label": "29.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Stafford"}, {"Town": "Stamford", "x": 134, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 44.6, "label": "44.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Stamford"}, {"Town": "Sterling", "x": 135, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 26.8, "label": "26.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Sterling"}, {"Town": "Stonington", "x": 136, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 14.5, "label": "14.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Stonington"}, {"Town": "Stratford", "x": 137, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 29.5, "label": "29.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Stratford"}, {"Town": "Suffield", "x": 138, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Suffield"}, {"Town": "Thomaston", "x": 139, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 15.2, "label": "15.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Thomaston"}, {"Town": "Thompson", "x": 140, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 36.7, "label": "36.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Thompson"}, {"Town": "Tolland", "x": 141, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.0, "label": "3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Tolland"}, {"Town": "Torrington", "x": 142, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 43.4, "label": "43.4", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Torrington"}, {"Town": "Trumbull", "x": 143, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Trumbull"}, {"Town": "Union", "x": 144, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Union"}, {"Town": "Vernon", "x": 145, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 29.9, "label": "29.9", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Vernon"}, {"Town": "Voluntown", "x": 146, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 13.8, "label": "13.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Voluntown"}, {"Town": "Wallingford", "x": 147, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 10.2, "label": "10.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Wallingford"}, {"Town": "Warren", "x": 148, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.8, "label": "6.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Warren"}, {"Town": "Washington", "x": 149, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.6, "label": "3.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Washington"}, {"Town": "Waterbury", "x": 150, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 77.4, "label": "77.4", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Waterbury"}, {"Town": "Waterford", "x": 151, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 13.3, "label": "13.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Waterford"}, {"Town": "Watertown", "x": 152, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 18.3, "label": "18.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Watertown"}, {"Town": "West Hartford", "x": 153, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 16.2, "label": "16.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "West Hartford"}, {"Town": "West Haven", "x": 154, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 56.2, "label": "56.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "West Haven"}, {"Town": "Westbrook", "x": 155, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 12.5, "label": "12.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Westbrook"}, {"Town": "Weston", "x": 156, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.0, "label": "0", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Weston"}, {"Town": "Westport", "x": 157, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 2.2, "label": "2.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Westport"}, {"Town": "Wethersfield", "x": 158, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 11.5, "label": "11.5", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Wethersfield"}, {"Town": "Willington", "x": 159, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 3.8, "label": "3.8", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Willington"}, {"Town": "Wilton", "x": 160, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 0.3, "label": "0.3", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Wilton"}, {"Town": "Winchester", "x": 161, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 48.2, "label": "48.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Winchester"}, {"Town": "Windham", "x": 162, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 78.2, "label": "78.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Windham"}, {"Town": "Windsor", "x": 163, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 23.7, "label": "23.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Windsor"}, {"Town": "Windsor Locks", "x": 164, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 31.0, "label": "31", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Windsor Locks"}, {"Town": "Wolcott", "x": 165, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 15.1, "label": "15.1", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Wolcott"}, {"Town": "Woodbridge", "x": 166, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 6.6, "label": "6.6", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Woodbridge"}, {"Town": "Woodbury", "x": 167, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 9.7, "label": "9.7", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Woodbury"}, {"Town": "Woodstock", "x": 168, "Measure Type": "Percent", "Grade": "Grade 1", "Value": 9.2, "label": "9.2", "Year": "2009", "Variable": "Eligibility for free or reduced price meals", "location_name": "Woodstock"}], "success": true, "min": 0.0}'
  ).data


function close_popup(){
  $('.close_popup').on('click',function() {
    $(this).closest('div.modal').modal('hide');
  });
}

function draw_graph(){
  $('#container').html('');
  x_axe_type = ( x_axe_name == 'Value' ? "linear" : "ordinal");
  y_axe_type = ( y_axe_name == 'Value' ? "linear" : "ordinal");
  height     = ( y_axe_name == 'Town'  ?  count_uniq_values_for(y_axe_name) * 10 : 900);
  width      = ( x_axe_name == 'Town'  ?  count_uniq_values_for(x_axe_name) * 10 : 600);

  var spec = {
    "width": width,
    "height": height,
    "data": [{"name": "table"}],
    "viewport": [900, 700],
    "scales": [
      {
        "name": "x", "type": x_axe_type, "range": "width", "nice": true ,"sort": true, //, "domainMin": min, "domainMax": max,
        "domain": {"data": "table", "field": x_dim}
      },
      {
        "name": "y", "type": y_axe_type, "range": "height", "sort": true,
        "domain": {"data": "table", "field": y_dim}
      },
      {
        "name": "c",
        "type": "ordinal",
        "domain": {"data": "table", "field": color},
        "range": ["#4670A7", "#080","#B63535", '#E8D619', '#19E85B', '#BE2287', '#BE2251','#6C6164','#9419E8','#C84130', '#B9C830']
      },
      {
        "name": "d",
        "type": "ordinal",
        "domain": {"data": "table", "field": size},
        "range": [50, 100, 150, 200, 250, 300]
      },
      {
        "name": "e",
        "type": "ordinal",
        "domain": {"data": "table", "field": shape},
        "range": ['circle', 'square', 'cross', 'diamond', 'triangle-up', 'triangle-down']
      }
    ],
    "axes": [
      { "type": "x", "scale": "x", "orient": "top", "offset": 0, "grid": true, "sort": true,
        "layer": "back", "titleOffset": 50, "ticks": 25, "title": x_axe_name,
        "properties": {
           "ticks": {
             "stroke": {"value": "#000"}
           },
           "majorTicks": {
             "strokeWidth": {"value": 1}
           },
           "labels": {
             "fill": {"value": "#000"},
             "angle": {"value": -40},
             "fontSize": {"value": 10},
             "align": {"value": "left"},
             "baseline": {"value": "middle"},
             "dx": {"value": 1},
             "dy": {"value": -10}
           },
           "title": {
             "fontSize": {"value": 12},
             "dy": {"value": 5}
           },
           "axis": {
             "stroke": {"value": "#000"},
             "strokeWidth": {"value": 1}
           }
         }
      },
      {"type": "y", "scale": "y", "grid": true, "title": y_axe_name, "layer": "back", "offset": 0,
        "properties": {
           "ticks": {
             "stroke": {"value": "#000"}
           },
           "majorTicks": {
             "strokeWidth": {"value": 1}
           },
           "labels": {
             "fill": {"value": "#000"},
             "fontSize": {"value": 9},
             "align": {"value": "right"},
             "baseline": {"value": "middle"},
             "dy": {"value": -7}
             // "dx": {"value": -70}
           },
           "title": {
             "fontSize": {"value": 12},
           },
           "axis": {
             "stroke": {"value": "#000"},
             "strokeWidth": {"value": 1}
           }
         }
      }
    ],
    "legends": [
      {
        "fill": "c",
        "title": 'Color',
        "offset": 0,
        "properties": {
          "symbols": {
            "fillOpacity": {"value": 0.8},
            "stroke": {"value": "transparent"}
          },
          "legend": {
              "x": {"value": -50},
              "y": {"value": -130},
            }
        }
      },
      {
        "size": "d",
        "title": 'Size',
        "offset": 0,
        "properties": {
          "legend": {
              "x": {"value": 200},
              "y": {"value": -130},
            }
        }
      },
      {
        "shape": "e",
        "title": 'Shape',
        "offset": 0,
        "properties": {
          "legend": {
              "x": {"value": 350},
              "y": {"value": -130},
            }
        }
      }
    ],
    "marks": [
      {
        "type": mark_type,
        "from": {"data": "table"},
        "properties": {
          "enter": {
            "x": {"scale": "x", "field": x_dim },
            "y": {"scale": "y", "field": y_dim},
            "stroke": {"scale": "c", "field": color},
            "fill": {"scale": "c", "field": color},
            "fillOpacity": {"value": 0.2},
            "size": {"scale": "d", "field": size},
            "shape": {"scale": "e", "field": shape},
          },
          "update": {
            "size": {"scale": "d", "field": size},
          },
          "hover": {
            "size": {"value": default_size * 6},
          }
        }
      },
      {
        "type": 'text',
        "from": {"data": "table"},
        "properties": {
          "enter": {
            "x": {"scale": "x", "field": x_dim },
            "y": {"scale": "y", "field": y_dim},
            "fill": {"value": "#000"},
            "fillOpacity": {"value": 0},
            "dy": {"value": -10},
            "dx": {"value": -13},
            "fontWeight": {"value": 900},
            "fontSize": {"value": 14},
            "text": {"field": "data.label"},
          },
          "update": {
            "fillOpacity": {"value": 0},
            "size": {"value": 300}
          },
          "hover": {
            "size": {"value": 300},
            "fillOpacity": {"value": 1}
          }
        }
      },
      {
        "type": mark_type,
        "interactive": false,
        "from": {"data": "table"},
        "properties": {
          "enter": {
            "x": {"scale": "x", "field": x_dim, "offset": 0},
            "y": {"scale": "y", "field": y_dim, "offset": 0},
            "fill": {"value": "transparent"},
            "strokeWidth": {"value": 2},
            "shape": {"scale": "e", "field": shape},
            // "shape": {"value": "symbol"}
          },
            "update": {
            // "size": {"value": default_size},
            "size": {"scale": "d", "field": size}
          },
            "hover": {
            // "size": {"value": default_size},
            "size": {"scale": "d", "field": size}
          }
        }
      }
    ]
  };

  var data = {table: data_items};

  vg.parse.spec(spec, function(chart) {
    var view = chart({el:"#container", data:data})
      .on("mouseover", function(event, item) {
        // invoke hover properties on cousin one hop forward in scenegraph
        view.update({
          props: "hover",
          items: item.cousin(1)
        });
      })
      .on("mouseout", function(event, item) {
        // reset cousin item, using animated transition
        view.update({
          props: "update",
          items: item.cousin(1),
          duration: 250,
          ease: "linear"
        });
      })
      .update();
  });

}

function count_uniq_values_for(key){
    ar = []
    $.each(data_items, function(i, el){ if (ar.indexOf(el[key]) == -1) ar.push(el[key]) })
    return ar.length
}

function get_data(){
  $.ajax({type: "POST",
    url: "/compare/join_for_two_datasets/",
    data: JSON.stringify({ main_dataset: $main_dataset_select.val(), compare_with: $compare_with_select.val(), filters: get_filters()}),
    contentType: 'application/json; charset=utf-8',
    success: function (data) {
      data_items = JSON.parse(data).data
      if (data_items.length > 0){
          min        = parseInt(JSON.parse(data).min)
          max        = parseInt(JSON.parse(data).max)
          // x_axe_name = "Value"
          // y_axe_name = ""


          draw_graph();

          dragToDroppable('y', main_geo_type)
          dragToDroppable('x', 'Value')
          dragToDroppable('color_s', 'Variable')
          $('.scale_variant').draggable({revert: "invalid", helper: "clone"})

          $('#select_uniq_values_popup').modal('hide');
      }else{
        $('#container').html('<div id="error">There is no available data to show. </div>')
        $('#select_uniq_values_popup').modal('hide');
      }
    }
  });

}
function addScale(name){
  $("#matches ul").append('<li class="scale_variant">' + name + '<a href="javascript:void" class="cancel-drag pull-right icon-remove hidden" ></a></li>')
}

function show_matches_in_popup(dataset_matches){
  $.each(dataset_matches, function(i, item){
    key = Object.keys(item)[0]
    without_spaces = key.replace(/\s/g, '-')
    addScale(key)
    $("ul.common_dimensions").append('<li class="common_li"> <h4>' + key + '</h4><ul class="common_li_ul '+ without_spaces +'"></ul></li>')
    $('.scale_variant').draggable({revert: "invalid", helper: "clone"})
    $.each(item[key], function(j, value){
      $('ul[class="common_li_ul '+ without_spaces + '"]').append(
        '<li class="dim_value"><label><input type="checkbox" name="'+ without_spaces+ '"value="' + value + '">'+value+'</lablel></li>'
        )
    })
  });
}

function show_non_matches_for_main_dataset_in_popup(main_no_matches){
  $.each(main_no_matches, function(i, item){
    key = Object.keys(item)[0]
    id  = $main_dataset_select.val()
    without_spaces = key.replace(/\s/g, '-')
    $("ul#main.left_dimensions").append('<li class="main_li"> <h4>' + key + '</h4><ul id="" class="main_li_ul '+ without_spaces +'"></ul></li>')

    $.each(item[key], function(j, value){
      $('ul[class="main_li_ul '+ without_spaces + '"]').append('<li class="dim_value"><label><input type="radio" name="'+ id +'_' + without_spaces+ '"value="' + value + '">'+value+'</lablel></li>')
    })
  });
}

function show_non_matches_for_comapre_dataset_in_popup(no_matches){
  $.each(no_matches, function(i, item){
    key = Object.keys(item)[0]
    id = $compare_with_select.val()
    without_spaces = key.replace(/\s/g, '-')
    $("ul#compare.left_dimensions").append('<li class="compare_li"> <h4>' + key + '</h4><ul class="compare_li_ul '+ without_spaces +'"></ul></li>')

    $.each(item[key], function(j, value){
      $('ul[class="compare_li_ul '+ without_spaces + '"]').append('<li class="dim_value"><label><input type="radio" name="'+ id +'_' + without_spaces+  '"value="' + value + '">'+value+'</lablel></li>')
    })
  });
}

function check_first_inputs(){
  $('.common_li_ul').each(function(i){
    $($('.common_li_ul')[i]).find('input').first().attr('checked', true)
    $($('.main_li_ul')[i]).find('input').first().attr('checked', true)
    $($('.compare_li_ul')[i]).find('input').first().attr('checked', true)
  })
}

function get_filters() {
  var filters = [];
  dimensions = $("li.common_li, li.main_li, li.compare_li")

  $.each(dimensions, function(i){
    var cur_dim = $(dimensions[i]);
    var cur_filter = {'field': cur_dim.find('h4').text(), 'values': []};
    var checked = cur_dim.find("input:checked")

    $.each(checked, function(option){
      cur_filter['values'].push(checked[option].value);
    });

    if(checked.length != 0)
      filters.push(cur_filter);
  });

  return filters;

}

function  dragToDroppable(id, value){
    $('.droppable#' + id).html(
        '<li class="scale_variant ui-draggable ui-draggable-handle" style="top: 0px; left: 0px;">'+ value +'<a href="javascript:void" class="cancel-drag pull-right icon-remove"></a>'
    )
}

$(document).ready(function(){
  close_popup()

  $main_dataset_select.on('change', function(){
    load_comparable_datasets( $(this).val() )
  });

  $('.scale_variant').draggable({revert: "invalid", helper: "clone"})
  $('.droppable').droppable({
    accept: ".scale_variant",
    activeClass: "ui-state-hover",
    hoverClass: "ui-state-active",
    drop: function( event, ui ) {
      $(this).addClass( "dropped" )
      ui.draggable.find('a').removeClass('hidden')

      switch($(this).attr('id')) {
        case "x":
          x_axe_name = $(ui.draggable).text();
          x_dim      = "data." + $(ui.draggable).text(); break;
        case "y":
          y_axe_name = $(ui.draggable).text();
          y_dim      = "data." + $(ui.draggable).text(); break;
        case "color_s":
          color = "data." + $(ui.draggable).text(); break;
        case "size_s":
          size  = "data." + $(ui.draggable).text(); break;
        case "shape_s":
          shape = "data." + $(ui.draggable).text(); break;
      }
      $(ui.draggable).detach().css({top: 0,left: 0}).appendTo(this);

      draw_graph();
    }
  });

  $('#change_mark_type').on('change', function(){
    mark_type = $(this).val();
    draw_graph();
  });

  $(document).on('click', '.cancel-drag', function(){
    $li = $(this).closest('li')
    $li.find('a').addClass('hidden')

    id = $(this).closest('li').closest('div').attr('id');

    switch(id) {
        case "x":
          x_axe_name = 'x'
          x_dim      = 'data.y'; break;
        case "y":
          y_axe_name = 'y';
          y_dim      = 'data.y'; break;
        case "color_s":
          color = 'data.color'; break;
        case "size_s":
          size  = 'data.size'; break;
        case "shape_s":
          shape = 'data.shape'; break;
    }

    $("#matches ul").append($li )
    $(this).closest('li').closest('div').removeClass('dropped')
    draw_graph();
  })

  $(document).on('change', "select#compare_with" , function(){
    $('#dataset_name_val').text( $main_dataset_select.val().toTitleCase() )
    $('#compare_with_val').text( $(this).val().toTitleCase() )
    $("#matches ul").html('');
    $("ul.common_dimensions").html('');
    $('#main_dataset_dimensions').html('<ul class="left_dimensions" id="main"></ul>')
    $('#compare_dataset_dimensions').html('<ul class="left_dimensions" id="compare"></ul>')
    $('#main_dataset_dimensions').prepend('<h3>' + $main_dataset_select.val().toTitleCase() + '</h3>')
    $('#compare_dataset_dimensions').prepend('<h3>' + $(this).val().toTitleCase() + '</h3>')
    $('.update-filters').removeClass('hidden')

    compare_dataset_data =  comparable.filter(function( item) {
                                if (item['dataset_name'] == $("select#compare_with").val())
                                    return item
                            })[0]

    show_matches_in_popup(matches[$(this).val()])
    show_non_matches_for_main_dataset_in_popup(compare_dataset_data.main_no_matches)
    show_non_matches_for_comapre_dataset_in_popup(compare_dataset_data.no_matches)

    $('.scale_variant').draggable({revert: "invalid", helper: "clone"})

    check_first_inputs()
    $('#select_uniq_values_popup').modal('show');
  });

  $('#continue_button').on('click', function(){
    get_data();
  })

  // draw_graph();

  $('.update-filters').on('click', function(){
    $('#select_uniq_values_popup').modal('show');
  })

})
