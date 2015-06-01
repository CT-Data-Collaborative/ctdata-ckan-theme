var $main_dataset_select = $("select#dataset_name"),
    $compare_with_select = $("select#compare_with"),
    matches              = {},
    x_axe_name           = "Value"
    y_axe_name           = ""
    main_geo_type        = "",
    mark_type            = "symbol",
    color                = '',
    shape                = '',
    size                 = '',
    min                  = 0,
    max                  = 200000,
    comparable           = [];
    // data_items           = [];

var data_items = JSON.parse(
  '{"max": 28.41, "data": [{"variable": "Workers 16 years and over", "location_name": "Andover", "fips": 901301080, "value": 6.54, "x": 0}, {"variable": "Workers 16 years and over", "location_name": "Ansonia", "fips": 900901220, "value": 9.44, "x": 1}, {"variable": "Workers 16 years and over", "location_name": "Ashford", "fips": 901501430, "value": 10.01, "x": 2}, {"variable": "Workers 16 years and over", "location_name": "Avon", "fips": 900302060, "value": 5.66, "x": 3}, {"variable": "Workers 16 years and over", "location_name": "Barkhamsted", "fips": 900502760, "value": 3.73, "x": 4}, {"variable": "Workers 16 years and over", "location_name": "Beacon Falls", "fips": 900903250, "value": 2.24, "x": 5}, {"variable": "Workers 16 years and over", "location_name": "Berlin", "fips": 900304300, "value": 6.42, "x": 6}, {"variable": "Workers 16 years and over", "location_name": "Bethany", "fips": 900904580, "value": 6.33, "x": 7}, {"variable": "Workers 16 years and over", "location_name": "Bethel", "fips": 900104720, "value": 5.94, "x": 8}, {"variable": "Workers 16 years and over", "location_name": "Bethlehem", "fips": 900504930, "value": 5.91, "x": 9}, {"variable": "Workers 16 years and over", "location_name": "Bloomfield", "fips": 900305910, "value": 11.85, "x": 10}, {"variable": "Workers 16 years and over", "location_name": "Bolton", "fips": 901306260, "value": 6.33, "x": 11}, {"variable": "Workers 16 years and over", "location_name": "Bozrah", "fips": 901106820, "value": 9.89, "x": 12}, {"variable": "Workers 16 years and over", "location_name": "Branford", "fips": 900907310, "value": 7.15, "x": 13}, {"variable": "Workers 16 years and over", "location_name": "Bridgeport", "fips": 900108070, "value": 12.73, "x": 14}, {"variable": "Workers 16 years and over", "location_name": "Bridgewater", "fips": 900508210, "value": 1.89, "x": 15}, {"variable": "Workers 16 years and over", "location_name": "Bristol", "fips": 900308490, "value": 7.37, "x": 16}, {"variable": "Workers 16 years and over", "location_name": "Brookfield", "fips": 900108980, "value": 5.49, "x": 17}, {"variable": "Workers 16 years and over", "location_name": "Brooklyn", "fips": 901509190, "value": 11.25, "x": 18}, {"variable": "Workers 16 years and over", "location_name": "Burlington", "fips": 900310100, "value": 7.73, "x": 19}, {"variable": "Workers 16 years and over", "location_name": "Canaan", "fips": 900510940, "value": 7.96, "x": 20}, {"variable": "Workers 16 years and over", "location_name": "Canterbury", "fips": 901512130, "value": 5.76, "x": 21}, {"variable": "Workers 16 years and over", "location_name": "Canton", "fips": 900312270, "value": 5.97, "x": 22}, {"variable": "Workers 16 years and over", "location_name": "Chaplin", "fips": 901513810, "value": 4.19, "x": 23}, {"variable": "Workers 16 years and over", "location_name": "Cheshire", "fips": 900914160, "value": 5.53, "x": 24}, {"variable": "Workers 16 years and over", "location_name": "Chester", "fips": 900714300, "value": 7.22, "x": 25}, {"variable": "Workers 16 years and over", "location_name": "Clinton", "fips": 900715350, "value": 9.77, "x": 26}, {"variable": "Workers 16 years and over", "location_name": "Colchester", "fips": 901115910, "value": 10.82, "x": 27}, {"variable": "Workers 16 years and over", "location_name": "Colebrook", "fips": 900516050, "value": 6.68, "x": 28}, {"variable": "Workers 16 years and over", "location_name": "Columbia", "fips": 901316400, "value": 4.09, "x": 29}, {"variable": "Workers 16 years and over", "location_name": "Connecticut", "fips": 9, "value": 8.32, "x": 30}, {"variable": "Workers 16 years and over", "location_name": "Cornwall", "fips": 900517240, "value": 5.47, "x": 31}, {"variable": "Workers 16 years and over", "location_name": "Coventry", "fips": 901317800, "value": 8.45, "x": 32}, {"variable": "Workers 16 years and over", "location_name": "Cromwell", "fips": 900718080, "value": 3.89, "x": 33}, {"variable": "Workers 16 years and over", "location_name": "Danbury", "fips": 900118500, "value": 9.89, "x": 34}, {"variable": "Workers 16 years and over", "location_name": "Darien", "fips": 900118850, "value": 2.93, "x": 35}, {"variable": "Workers 16 years and over", "location_name": "Deep River", "fips": 900719130, "value": 6.68, "x": 36}, {"variable": "Workers 16 years and over", "location_name": "Derby", "fips": 900919550, "value": 9.56, "x": 37}, {"variable": "Workers 16 years and over", "location_name": "Durham", "fips": 900720810, "value": 7.29, "x": 38}, {"variable": "Workers 16 years and over", "location_name": "Eastford", "fips": 901521860, "value": 8.39, "x": 39}, {"variable": "Workers 16 years and over", "location_name": "East Granby", "fips": 900322070, "value": 9.32, "x": 40}, {"variable": "Workers 16 years and over", "location_name": "East Haddam", "fips": 900722280, "value": 7.54, "x": 41}, {"variable": "Workers 16 years and over", "location_name": "East Hampton", "fips": 900722490, "value": 4.19, "x": 42}, {"variable": "Workers 16 years and over", "location_name": "East Hartford", "fips": 900322630, "value": 14.1, "x": 43}, {"variable": "Workers 16 years and over", "location_name": "East Haven", "fips": 900922910, "value": 7.47, "x": 44}, {"variable": "Workers 16 years and over", "location_name": "East Lyme", "fips": 901123400, "value": 6.57, "x": 45}, {"variable": "Workers 16 years and over", "location_name": "Easton", "fips": 900123890, "value": 5.11, "x": 46}, {"variable": "Workers 16 years and over", "location_name": "East Windsor", "fips": 900324800, "value": 11.96, "x": 47}, {"variable": "Workers 16 years and over", "location_name": "Ellington", "fips": 901325360, "value": 6.45, "x": 48}, {"variable": "Workers 16 years and over", "location_name": "Enfield", "fips": 900325990, "value": 8.46, "x": 49}, {"variable": "Workers 16 years and over", "location_name": "Essex", "fips": 900726270, "value": 8.94, "x": 50}, {"variable": "Workers 16 years and over", "location_name": "Fairfield", "fips": 900126620, "value": 5.36, "x": 51}, {"variable": "Workers 16 years and over", "location_name": "Farmington", "fips": 900327600, "value": 5.23, "x": 52}, {"variable": "Workers 16 years and over", "location_name": "Franklin", "fips": 901129910, "value": 3.24, "x": 53}, {"variable": "Workers 16 years and over", "location_name": "Glastonbury", "fips": 900331240, "value": 6.16, "x": 54}, {"variable": "Workers 16 years and over", "location_name": "Goshen", "fips": 900532290, "value": 4.43, "x": 55}, {"variable": "Workers 16 years and over", "location_name": "Granby", "fips": 900332640, "value": 2.92, "x": 56}, {"variable": "Workers 16 years and over", "location_name": "Greenwich", "fips": 900133620, "value": 5.93, "x": 57}, {"variable": "Workers 16 years and over", "location_name": "Griswold", "fips": 901133900, "value": 9.28, "x": 58}, {"variable": "Workers 16 years and over", "location_name": "Groton", "fips": 901134250, "value": 9.95, "x": 59}, {"variable": "Workers 16 years and over", "location_name": "Guilford", "fips": 900934950, "value": 6.68, "x": 60}, {"variable": "Workers 16 years and over", "location_name": "Haddam", "fips": 900735230, "value": 9.01, "x": 61}, {"variable": "Workers 16 years and over", "location_name": "Hamden", "fips": 900935650, "value": 9.27, "x": 62}, {"variable": "Workers 16 years and over", "location_name": "Hampton", "fips": 901536000, "value": 4.13, "x": 63}, {"variable": "Workers 16 years and over", "location_name": "Hartford", "fips": 900337070, "value": 14.0, "x": 64}, {"variable": "Workers 16 years and over", "location_name": "Hartland", "fips": 900337140, "value": 8.63, "x": 65}, {"variable": "Workers 16 years and over", "location_name": "Harwinton", "fips": 900537280, "value": 3.96, "x": 66}, {"variable": "Workers 16 years and over", "location_name": "Hebron", "fips": 901337910, "value": 4.91, "x": 67}, {"variable": "Workers 16 years and over", "location_name": "Kent", "fips": 900540290, "value": 10.96, "x": 68}, {"variable": "Workers 16 years and over", "location_name": "Killingly", "fips": 901540500, "value": 12.65, "x": 69}, {"variable": "Workers 16 years and over", "location_name": "Killingworth", "fips": 900740710, "value": 6.27, "x": 70}, {"variable": "Workers 16 years and over", "location_name": "Lebanon", "fips": 901142390, "value": 14.84, "x": 71}, {"variable": "Workers 16 years and over", "location_name": "Ledyard", "fips": 901142600, "value": 9.49, "x": 72}, {"variable": "Workers 16 years and over", "location_name": "Lisbon", "fips": 901143230, "value": 2.78, "x": 73}, {"variable": "Workers 16 years and over", "location_name": "Litchfield", "fips": 900543370, "value": 4.58, "x": 74}, {"variable": "Workers 16 years and over", "location_name": "Lyme", "fips": 901144210, "value": 6.03, "x": 75}, {"variable": "Workers 16 years and over", "location_name": "Madison", "fips": 900944560, "value": 5.46, "x": 76}, {"variable": "Workers 16 years and over", "location_name": "Manchester", "fips": 900344700, "value": 9.32, "x": 77}, {"variable": "Workers 16 years and over", "location_name": "Mansfield", "fips": 901344910, "value": 6.82, "x": 78}, {"variable": "Workers 16 years and over", "location_name": "Marlborough", "fips": 900345820, "value": 6.27, "x": 79}, {"variable": "Workers 16 years and over", "location_name": "Meriden", "fips": 900946520, "value": 8.78, "x": 80}, {"variable": "Workers 16 years and over", "location_name": "Middlebury", "fips": 900946940, "value": 4.32, "x": 81}, {"variable": "Workers 16 years and over", "location_name": "Middlefield", "fips": 900747080, "value": 5.48, "x": 82}, {"variable": "Workers 16 years and over", "location_name": "Middletown", "fips": 900747360, "value": 7.8, "x": 83}, {"variable": "Workers 16 years and over", "location_name": "Milford", "fips": 900947535, "value": 6.44, "x": 84}, {"variable": "Workers 16 years and over", "location_name": "Monroe", "fips": 900148620, "value": 5.87, "x": 85}, {"variable": "Workers 16 years and over", "location_name": "Montville", "fips": 901148900, "value": 14.34, "x": 86}, {"variable": "Workers 16 years and over", "location_name": "Morris", "fips": 900549460, "value": 2.63, "x": 87}, {"variable": "Workers 16 years and over", "location_name": "Naugatuck", "fips": 900949950, "value": 9.28, "x": 88}, {"variable": "Workers 16 years and over", "location_name": "New Britain", "fips": 900350440, "value": 9.37, "x": 89}, {"variable": "Workers 16 years and over", "location_name": "New Canaan", "fips": 900150580, "value": 2.78, "x": 90}, {"variable": "Workers 16 years and over", "location_name": "New Fairfield", "fips": 900150860, "value": 5.58, "x": 91}, {"variable": "Workers 16 years and over", "location_name": "New Hartford", "fips": 900551350, "value": 4.83, "x": 92}, {"variable": "Workers 16 years and over", "location_name": "New Haven", "fips": 900952070, "value": 10.36, "x": 93}, {"variable": "Workers 16 years and over", "location_name": "Newington", "fips": 900352140, "value": 6.94, "x": 94}, {"variable": "Workers 16 years and over", "location_name": "New London", "fips": 901152350, "value": 10.61, "x": 95}, {"variable": "Workers 16 years and over", "location_name": "New Milford", "fips": 900552630, "value": 8.18, "x": 96}, {"variable": "Workers 16 years and over", "location_name": "Newtown", "fips": 900152980, "value": 4.9, "x": 97}, {"variable": "Workers 16 years and over", "location_name": "Norfolk", "fips": 900553470, "value": 5.37, "x": 98}, {"variable": "Workers 16 years and over", "location_name": "North Branford", "fips": 900953890, "value": 5.54, "x": 99}, {"variable": "Workers 16 years and over", "location_name": "North Canaan", "fips": 900554030, "value": 7.28, "x": 100}, {"variable": "Workers 16 years and over", "location_name": "North Haven", "fips": 900954870, "value": 6.48, "x": 101}, {"variable": "Workers 16 years and over", "location_name": "North Stonington", "fips": 901155500, "value": 8.62, "x": 102}, {"variable": "Workers 16 years and over", "location_name": "Norwalk", "fips": 900156060, "value": 7.47, "x": 103}, {"variable": "Workers 16 years and over", "location_name": "Norwich", "fips": 901156270, "value": 12.24, "x": 104}, {"variable": "Workers 16 years and over", "location_name": "Old Lyme", "fips": 901157040, "value": 7.86, "x": 105}, {"variable": "Workers 16 years and over", "location_name": "Old Saybrook", "fips": 900757320, "value": 6.32, "x": 106}, {"variable": "Workers 16 years and over", "location_name": "Orange", "fips": 900957600, "value": 4.69, "x": 107}, {"variable": "Workers 16 years and over", "location_name": "Oxford", "fips": 900958300, "value": 7.73, "x": 108}, {"variable": "Workers 16 years and over", "location_name": "Plainfield", "fips": 901559980, "value": 14.04, "x": 109}, {"variable": "Workers 16 years and over", "location_name": "Plainville", "fips": 900360120, "value": 6.87, "x": 110}, {"variable": "Workers 16 years and over", "location_name": "Plymouth", "fips": 900560750, "value": 7.56, "x": 111}, {"variable": "Workers 16 years and over", "location_name": "Pomfret", "fips": 901561030, "value": 8.56, "x": 112}, {"variable": "Workers 16 years and over", "location_name": "Portland", "fips": 900761800, "value": 6.76, "x": 113}, {"variable": "Workers 16 years and over", "location_name": "Preston", "fips": 901162150, "value": 1.81, "x": 114}, {"variable": "Workers 16 years and over", "location_name": "Priority School Districts", "fips": 91000000000096, "value": 0.0, "x": 115}, {"variable": "Workers 16 years and over", "location_name": "Prospect", "fips": 900962290, "value": 7.27, "x": 116}, {"variable": "Workers 16 years and over", "location_name": "Putnam", "fips": 901562710, "value": 11.07, "x": 117}, {"variable": "Workers 16 years and over", "location_name": "Redding", "fips": 900163480, "value": 4.0, "x": 118}, {"variable": "Workers 16 years and over", "location_name": "Ridgefield", "fips": 900163970, "value": 5.25, "x": 119}, {"variable": "Workers 16 years and over", "location_name": "Rocky Hill", "fips": 900365370, "value": 6.47, "x": 120}, {"variable": "Workers 16 years and over", "location_name": "Roxbury", "fips": 900565930, "value": 3.07, "x": 121}, {"variable": "Workers 16 years and over", "location_name": "Salem", "fips": 901166210, "value": 7.1, "x": 122}, {"variable": "Workers 16 years and over", "location_name": "Salisbury", "fips": 900566420, "value": 4.47, "x": 123}, {"variable": "Workers 16 years and over", "location_name": "Scotland", "fips": 901567400, "value": 6.09, "x": 124}, {"variable": "Workers 16 years and over", "location_name": "Seymour", "fips": 900967610, "value": 8.96, "x": 125}, {"variable": "Workers 16 years and over", "location_name": "Sharon", "fips": 900567960, "value": 4.17, "x": 126}, {"variable": "Workers 16 years and over", "location_name": "Shelton", "fips": 900168170, "value": 5.11, "x": 127}, {"variable": "Workers 16 years and over", "location_name": "Sherman", "fips": 900168310, "value": 5.29, "x": 128}, {"variable": "Workers 16 years and over", "location_name": "Simsbury", "fips": 900368940, "value": 5.32, "x": 129}, {"variable": "Workers 16 years and over", "location_name": "Somers", "fips": 901369220, "value": 6.65, "x": 130}, {"variable": "Workers 16 years and over", "location_name": "Southbury", "fips": 900969640, "value": 5.48, "x": 131}, {"variable": "Workers 16 years and over", "location_name": "Southington", "fips": 900370550, "value": 5.94, "x": 132}, {"variable": "Workers 16 years and over", "location_name": "South Windsor", "fips": 900371390, "value": 5.87, "x": 133}, {"variable": "Workers 16 years and over", "location_name": "Sprague", "fips": 901171670, "value": 15.12, "x": 134}, {"variable": "Workers 16 years and over", "location_name": "Stafford", "fips": 901372090, "value": 7.44, "x": 135}, {"variable": "Workers 16 years and over", "location_name": "Stamford", "fips": 900173070, "value": 11.25, "x": 136}, {"variable": "Workers 16 years and over", "location_name": "Sterling", "fips": 901573420, "value": 11.73, "x": 137}, {"variable": "Workers 16 years and over", "location_name": "Stonington", "fips": 901173770, "value": 6.71, "x": 138}, {"variable": "Workers 16 years and over", "location_name": "Stratford", "fips": 900174190, "value": 8.04, "x": 139}, {"variable": "Workers 16 years and over", "location_name": "Suffield", "fips": 900374540, "value": 8.57, "x": 140}, {"variable": "Workers 16 years and over", "location_name": "Thomaston", "fips": 900575730, "value": 6.91, "x": 141}, {"variable": "Workers 16 years and over", "location_name": "Thompson", "fips": 901575870, "value": 7.05, "x": 142}, {"variable": "Workers 16 years and over", "location_name": "Tolland", "fips": 901376290, "value": 5.64, "x": 143}, {"variable": "Workers 16 years and over", "location_name": "Torrington", "fips": 900576570, "value": 11.21, "x": 144}, {"variable": "Workers 16 years and over", "location_name": "Trumbull", "fips": 900177200, "value": 5.0, "x": 145}, {"variable": "Workers 16 years and over", "location_name": "Union", "fips": 901377830, "value": 7.42, "x": 146}, {"variable": "Workers 16 years and over", "location_name": "Vernon", "fips": 901378250, "value": 8.2, "x": 147}, {"variable": "Workers 16 years and over", "location_name": "Voluntown", "fips": 901178600, "value": 10.74, "x": 148}, {"variable": "Workers 16 years and over", "location_name": "Wallingford", "fips": 900978740, "value": 8.32, "x": 149}, {"variable": "Workers 16 years and over", "location_name": "Warren", "fips": 900579510, "value": 14.61, "x": 150}, {"variable": "Workers 16 years and over", "location_name": "Washington", "fips": 900579720, "value": 4.0, "x": 151}, {"variable": "Workers 16 years and over", "location_name": "Waterbury", "fips": 900980070, "value": 10.35, "x": 152}, {"variable": "Workers 16 years and over", "location_name": "Waterford", "fips": 901180280, "value": 5.87, "x": 153}, {"variable": "Workers 16 years and over", "location_name": "Watertown", "fips": 900580490, "value": 6.41, "x": 154}, {"variable": "Workers 16 years and over", "location_name": "Westbrook", "fips": 900781680, "value": 9.67, "x": 155}, {"variable": "Workers 16 years and over", "location_name": "West Hartford", "fips": 900382590, "value": 8.47, "x": 156}, {"variable": "Workers 16 years and over", "location_name": "West Haven", "fips": 900982870, "value": 8.85, "x": 157}, {"variable": "Workers 16 years and over", "location_name": "Weston", "fips": 900183430, "value": 1.72, "x": 158}, {"variable": "Workers 16 years and over", "location_name": "Westport", "fips": 900183500, "value": 2.54, "x": 159}, {"variable": "Workers 16 years and over", "location_name": "Wethersfield", "fips": 900384900, "value": 8.39, "x": 160}, {"variable": "Workers 16 years and over", "location_name": "Willington", "fips": 901385950, "value": 7.3, "x": 161}, {"variable": "Workers 16 years and over", "location_name": "Wilton", "fips": 900186370, "value": 3.06, "x": 162}, {"variable": "Workers 16 years and over", "location_name": "Winchester", "fips": 900586440, "value": 9.58, "x": 163}, {"variable": "Workers 16 years and over", "location_name": "Windham", "fips": 901586790, "value": 17.05, "x": 164}, {"variable": "Workers 16 years and over", "location_name": "Windsor", "fips": 900387000, "value": 8.83, "x": 165}, {"variable": "Workers 16 years and over", "location_name": "Windsor Locks", "fips": 900387070, "value": 7.13, "x": 166}, {"variable": "Workers 16 years and over", "location_name": "Wolcott", "fips": 900987560, "value": 5.34, "x": 167}, {"variable": "Workers 16 years and over", "location_name": "Woodbridge", "fips": 900987700, "value": 6.36, "x": 168}, {"variable": "Workers 16 years and over", "location_name": "Woodbury", "fips": 900587910, "value": 4.05, "x": 169}, {"variable": "Workers 16 years and over", "location_name": "Woodstock", "fips": 901588190, "value": 7.45, "x": 170}, {"variable": "Workers 16 years and over", "location_name": "New District", "fips": 999, "value": 0.0, "x": 171}, {"variable": "Workers 16 years and over", "location_name": "Ansonia School", "fips": 900901220, "value": 0.0, "x": 172}, {"variable": "Workers 16 years and over", "location_name": "Ansonia School District", "fips": null, "value": 0.0, "x": 173}, {"variable": "Population 25 years and over", "location_name": "Andover", "fips": 901301080, "value": 8.25, "x": 0}, {"variable": "Population 25 years and over", "location_name": "Ansonia", "fips": 900901220, "value": 11.49, "x": 1}, {"variable": "Population 25 years and over", "location_name": "Ashford", "fips": 901501430, "value": 6.76, "x": 2}, {"variable": "Population 25 years and over", "location_name": "Avon", "fips": 900302060, "value": 3.37, "x": 3}, {"variable": "Population 25 years and over", "location_name": "Barkhamsted", "fips": 900502760, "value": 9.81, "x": 4}, {"variable": "Population 25 years and over", "location_name": "Beacon Falls", "fips": 900903250, "value": 6.58, "x": 5}, {"variable": "Population 25 years and over", "location_name": "Berlin", "fips": 900304300, "value": 7.68, "x": 6}, {"variable": "Population 25 years and over", "location_name": "Bethany", "fips": 900904580, "value": 2.22, "x": 7}, {"variable": "Population 25 years and over", "location_name": "Bethel", "fips": 900104720, "value": 7.54, "x": 8}, {"variable": "Population 25 years and over", "location_name": "Bethlehem", "fips": 900504930, "value": 3.8, "x": 9}, {"variable": "Population 25 years and over", "location_name": "Bloomfield", "fips": 900305910, "value": 8.72, "x": 10}, {"variable": "Population 25 years and over", "location_name": "Bolton", "fips": 901306260, "value": 8.19, "x": 11}, {"variable": "Population 25 years and over", "location_name": "Bozrah", "fips": 901106820, "value": 3.72, "x": 12}, {"variable": "Population 25 years and over", "location_name": "Branford", "fips": 900907310, "value": 7.73, "x": 13}, {"variable": "Population 25 years and over", "location_name": "Bridgeport", "fips": 900108070, "value": 26.79, "x": 14}, {"variable": "Population 25 years and over", "location_name": "Bridgewater", "fips": 900508210, "value": 3.42, "x": 15}, {"variable": "Population 25 years and over", "location_name": "Bristol", "fips": 900308490, "value": 13.15, "x": 16}, {"variable": "Population 25 years and over", "location_name": "Brookfield", "fips": 900108980, "value": 4.13, "x": 17}, {"variable": "Population 25 years and over", "location_name": "Brooklyn", "fips": 901509190, "value": 16.83, "x": 18}, {"variable": "Population 25 years and over", "location_name": "Burlington", "fips": 900310100, "value": 5.37, "x": 19}, {"variable": "Population 25 years and over", "location_name": "Canaan", "fips": 900510940, "value": 3.6, "x": 20}, {"variable": "Population 25 years and over", "location_name": "Canterbury", "fips": 901512130, "value": 13.45, "x": 21}, {"variable": "Population 25 years and over", "location_name": "Canton", "fips": 900312270, "value": 3.93, "x": 22}, {"variable": "Population 25 years and over", "location_name": "Chaplin", "fips": 901513810, "value": 11.82, "x": 23}, {"variable": "Population 25 years and over", "location_name": "Cheshire", "fips": 900914160, "value": 4.6, "x": 24}, {"variable": "Population 25 years and over", "location_name": "Chester", "fips": 900714300, "value": 13.71, "x": 25}, {"variable": "Population 25 years and over", "location_name": "Clinton", "fips": 900715350, "value": 7.92, "x": 26}, {"variable": "Population 25 years and over", "location_name": "Colchester", "fips": 901115910, "value": 5.1, "x": 27}, {"variable": "Population 25 years and over", "location_name": "Colebrook", "fips": 900516050, "value": 11.42, "x": 28}, {"variable": "Population 25 years and over", "location_name": "Columbia", "fips": 901316400, "value": 10.97, "x": 29}, {"variable": "Population 25 years and over", "location_name": "Connecticut", "fips": 9, "value": 9.74, "x": 30}, {"variable": "Population 25 years and over", "location_name": "Cornwall", "fips": 900517240, "value": 5.21, "x": 31}, {"variable": "Population 25 years and over", "location_name": "Coventry", "fips": 901317800, "value": 5.67, "x": 32}, {"variable": "Population 25 years and over", "location_name": "Cromwell", "fips": 900718080, "value": 7.59, "x": 33}, {"variable": "Population 25 years and over", "location_name": "Danbury", "fips": 900118500, "value": 17.13, "x": 34}, {"variable": "Population 25 years and over", "location_name": "Darien", "fips": 900118850, "value": 2.7, "x": 35}, {"variable": "Population 25 years and over", "location_name": "Deep River", "fips": 900719130, "value": 10.26, "x": 36}, {"variable": "Population 25 years and over", "location_name": "Derby", "fips": 900919550, "value": 15.38, "x": 37}, {"variable": "Population 25 years and over", "location_name": "Durham", "fips": 900720810, "value": 4.68, "x": 38}, {"variable": "Population 25 years and over", "location_name": "Eastford", "fips": 901521860, "value": 5.6, "x": 39}, {"variable": "Population 25 years and over", "location_name": "East Granby", "fips": 900322070, "value": 4.67, "x": 40}, {"variable": "Population 25 years and over", "location_name": "East Haddam", "fips": 900722280, "value": 6.72, "x": 41}, {"variable": "Population 25 years and over", "location_name": "East Hampton", "fips": 900722490, "value": 5.57, "x": 42}, {"variable": "Population 25 years and over", "location_name": "East Hartford", "fips": 900322630, "value": 16.4, "x": 43}, {"variable": "Population 25 years and over", "location_name": "East Haven", "fips": 900922910, "value": 13.82, "x": 44}, {"variable": "Population 25 years and over", "location_name": "East Lyme", "fips": 901123400, "value": 4.49, "x": 45}, {"variable": "Population 25 years and over", "location_name": "Easton", "fips": 900123890, "value": 8.05, "x": 46}, {"variable": "Population 25 years and over", "location_name": "East Windsor", "fips": 900324800, "value": 11.36, "x": 47}, {"variable": "Population 25 years and over", "location_name": "Ellington", "fips": 901325360, "value": 7.48, "x": 48}, {"variable": "Population 25 years and over", "location_name": "Enfield", "fips": 900325990, "value": 8.63, "x": 49}, {"variable": "Population 25 years and over", "location_name": "Essex", "fips": 900726270, "value": 3.15, "x": 50}, {"variable": "Population 25 years and over", "location_name": "Fairfield", "fips": 900126620, "value": 5.15, "x": 51}, {"variable": "Population 25 years and over", "location_name": "Farmington", "fips": 900327600, "value": 3.72, "x": 52}, {"variable": "Population 25 years and over", "location_name": "Franklin", "fips": 901129910, "value": 9.03, "x": 53}, {"variable": "Population 25 years and over", "location_name": "Glastonbury", "fips": 900331240, "value": 2.36, "x": 54}, {"variable": "Population 25 years and over", "location_name": "Goshen", "fips": 900532290, "value": 5.73, "x": 55}, {"variable": "Population 25 years and over", "location_name": "Granby", "fips": 900332640, "value": 5.52, "x": 56}, {"variable": "Population 25 years and over", "location_name": "Greenwich", "fips": 900133620, "value": 3.76, "x": 57}, {"variable": "Population 25 years and over", "location_name": "Griswold", "fips": 901133900, "value": 12.51, "x": 58}, {"variable": "Population 25 years and over", "location_name": "Groton", "fips": 901134250, "value": 10.68, "x": 59}, {"variable": "Population 25 years and over", "location_name": "Guilford", "fips": 900934950, "value": 2.81, "x": 60}, {"variable": "Population 25 years and over", "location_name": "Haddam", "fips": 900735230, "value": 9.35, "x": 61}, {"variable": "Population 25 years and over", "location_name": "Hamden", "fips": 900935650, "value": 7.3, "x": 62}, {"variable": "Population 25 years and over", "location_name": "Hampton", "fips": 901536000, "value": 5.54, "x": 63}, {"variable": "Population 25 years and over", "location_name": "Hartford", "fips": 900337070, "value": 28.41, "x": 64}, {"variable": "Population 25 years and over", "location_name": "Hartland", "fips": 900337140, "value": 4.71, "x": 65}, {"variable": "Population 25 years and over", "location_name": "Harwinton", "fips": 900537280, "value": 8.42, "x": 66}, {"variable": "Population 25 years and over", "location_name": "Hebron", "fips": 901337910, "value": 6.19, "x": 67}, {"variable": "Population 25 years and over", "location_name": "Kent", "fips": 900540290, "value": 7.69, "x": 68}, {"variable": "Population 25 years and over", "location_name": "Killingly", "fips": 901540500, "value": 19.03, "x": 69}, {"variable": "Population 25 years and over", "location_name": "Killingworth", "fips": 900740710, "value": 9.71, "x": 70}, {"variable": "Population 25 years and over", "location_name": "Lebanon", "fips": 901142390, "value": 8.81, "x": 71}, {"variable": "Population 25 years and over", "location_name": "Ledyard", "fips": 901142600, "value": 7.59, "x": 72}, {"variable": "Population 25 years and over", "location_name": "Lisbon", "fips": 901143230, "value": 11.89, "x": 73}, {"variable": "Population 25 years and over", "location_name": "Litchfield", "fips": 900543370, "value": 7.31, "x": 74}, {"variable": "Population 25 years and over", "location_name": "Lyme", "fips": 901144210, "value": 1.41, "x": 75}, {"variable": "Population 25 years and over", "location_name": "Madison", "fips": 900944560, "value": 3.57, "x": 76}, {"variable": "Population 25 years and over", "location_name": "Manchester", "fips": 900344700, "value": 9.93, "x": 77}, {"variable": "Population 25 years and over", "location_name": "Mansfield", "fips": 901344910, "value": 4.27, "x": 78}, {"variable": "Population 25 years and over", "location_name": "Marlborough", "fips": 900345820, "value": 6.28, "x": 79}, {"variable": "Population 25 years and over", "location_name": "Meriden", "fips": 900946520, "value": 13.64, "x": 80}, {"variable": "Population 25 years and over", "location_name": "Middlebury", "fips": 900946940, "value": 4.28, "x": 81}, {"variable": "Population 25 years and over", "location_name": "Middlefield", "fips": 900747080, "value": 5.19, "x": 82}, {"variable": "Population 25 years and over", "location_name": "Middletown", "fips": 900747360, "value": 10.28, "x": 83}, {"variable": "Population 25 years and over", "location_name": "Milford", "fips": 900947535, "value": 7.43, "x": 84}, {"variable": "Population 25 years and over", "location_name": "Monroe", "fips": 900148620, "value": 4.15, "x": 85}, {"variable": "Population 25 years and over", "location_name": "Montville", "fips": 901148900, "value": 12.56, "x": 86}, {"variable": "Population 25 years and over", "location_name": "Morris", "fips": 900549460, "value": 6.81, "x": 87}, {"variable": "Population 25 years and over", "location_name": "Naugatuck", "fips": 900949950, "value": 12.83, "x": 88}, {"variable": "Population 25 years and over", "location_name": "New Britain", "fips": 900350440, "value": 22.65, "x": 89}, {"variable": "Population 25 years and over", "location_name": "New Canaan", "fips": 900150580, "value": 2.86, "x": 90}, {"variable": "Population 25 years and over", "location_name": "New Fairfield", "fips": 900150860, "value": 5.43, "x": 91}, {"variable": "Population 25 years and over", "location_name": "New Hartford", "fips": 900551350, "value": 5.53, "x": 92}, {"variable": "Population 25 years and over", "location_name": "New Haven", "fips": 900952070, "value": 16.01, "x": 93}, {"variable": "Population 25 years and over", "location_name": "Newington", "fips": 900352140, "value": 12.38, "x": 94}, {"variable": "Population 25 years and over", "location_name": "New London", "fips": 901152350, "value": 14.13, "x": 95}, {"variable": "Population 25 years and over", "location_name": "New Milford", "fips": 900552630, "value": 6.92, "x": 96}, {"variable": "Population 25 years and over", "location_name": "Newtown", "fips": 900152980, "value": 6.44, "x": 97}, {"variable": "Population 25 years and over", "location_name": "Norfolk", "fips": 900553470, "value": 5.81, "x": 98}, {"variable": "Population 25 years and over", "location_name": "North Branford", "fips": 900953890, "value": 7.32, "x": 99}, {"variable": "Population 25 years and over", "location_name": "North Canaan", "fips": 900554030, "value": 22.35, "x": 100}, {"variable": "Population 25 years and over", "location_name": "North Haven", "fips": 900954870, "value": 7.93, "x": 101}, {"variable": "Population 25 years and over", "location_name": "North Stonington", "fips": 901155500, "value": 8.12, "x": 102}, {"variable": "Population 25 years and over", "location_name": "Norwalk", "fips": 900156060, "value": 9.51, "x": 103}, {"variable": "Population 25 years and over", "location_name": "Norwich", "fips": 901156270, "value": 12.63, "x": 104}, {"variable": "Population 25 years and over", "location_name": "Old Lyme", "fips": 901157040, "value": 3.98, "x": 105}, {"variable": "Population 25 years and over", "location_name": "Old Saybrook", "fips": 900757320, "value": 4.96, "x": 106}, {"variable": "Population 25 years and over", "location_name": "Orange", "fips": 900957600, "value": 4.94, "x": 107}, {"variable": "Population 25 years and over", "location_name": "Oxford", "fips": 900958300, "value": 5.63, "x": 108}, {"variable": "Population 25 years and over", "location_name": "Plainfield", "fips": 901559980, "value": 21.65, "x": 109}, {"variable": "Population 25 years and over", "location_name": "Plainville", "fips": 900360120, "value": 10.69, "x": 110}, {"variable": "Population 25 years and over", "location_name": "Plymouth", "fips": 900560750, "value": 10.68, "x": 111}, {"variable": "Population 25 years and over", "location_name": "Pomfret", "fips": 901561030, "value": 7.65, "x": 112}, {"variable": "Population 25 years and over", "location_name": "Portland", "fips": 900761800, "value": 5.0, "x": 113}, {"variable": "Population 25 years and over", "location_name": "Preston", "fips": 901162150, "value": 13.98, "x": 114}, {"variable": "Population 25 years and over", "location_name": "Priority School Districts", "fips": 91000000000096, "value": 0.0, "x": 115}, {"variable": "Population 25 years and over", "location_name": "Prospect", "fips": 900962290, "value": 8.57, "x": 116}, {"variable": "Population 25 years and over", "location_name": "Putnam", "fips": 901562710, "value": 13.06, "x": 117}, {"variable": "Population 25 years and over", "location_name": "Redding", "fips": 900163480, "value": 1.59, "x": 118}, {"variable": "Population 25 years and over", "location_name": "Ridgefield", "fips": 900163970, "value": 1.98, "x": 119}, {"variable": "Population 25 years and over", "location_name": "Rocky Hill", "fips": 900365370, "value": 8.32, "x": 120}, {"variable": "Population 25 years and over", "location_name": "Roxbury", "fips": 900565930, "value": 3.25, "x": 121}, {"variable": "Population 25 years and over", "location_name": "Salem", "fips": 901166210, "value": 10.69, "x": 122}, {"variable": "Population 25 years and over", "location_name": "Salisbury", "fips": 900566420, "value": 15.1, "x": 123}, {"variable": "Population 25 years and over", "location_name": "Scotland", "fips": 901567400, "value": 12.33, "x": 124}, {"variable": "Population 25 years and over", "location_name": "Seymour", "fips": 900967610, "value": 10.01, "x": 125}, {"variable": "Population 25 years and over", "location_name": "Sharon", "fips": 900567960, "value": 6.49, "x": 126}, {"variable": "Population 25 years and over", "location_name": "Shelton", "fips": 900168170, "value": 9.51, "x": 127}, {"variable": "Population 25 years and over", "location_name": "Sherman", "fips": 900168310, "value": 1.51, "x": 128}, {"variable": "Population 25 years and over", "location_name": "Simsbury", "fips": 900368940, "value": 3.29, "x": 129}, {"variable": "Population 25 years and over", "location_name": "Somers", "fips": 901369220, "value": 6.27, "x": 130}, {"variable": "Population 25 years and over", "location_name": "Southbury", "fips": 900969640, "value": 6.1, "x": 131}, {"variable": "Population 25 years and over", "location_name": "Southington", "fips": 900370550, "value": 7.31, "x": 132}, {"variable": "Population 25 years and over", "location_name": "South Windsor", "fips": 900371390, "value": 4.13, "x": 133}, {"variable": "Population 25 years and over", "location_name": "Sprague", "fips": 901171670, "value": 3.65, "x": 134}, {"variable": "Population 25 years and over", "location_name": "Stafford", "fips": 901372090, "value": 7.72, "x": 135}, {"variable": "Population 25 years and over", "location_name": "Stamford", "fips": 900173070, "value": 7.23, "x": 136}, {"variable": "Population 25 years and over", "location_name": "Sterling", "fips": 901573420, "value": 18.29, "x": 137}, {"variable": "Population 25 years and over", "location_name": "Stonington", "fips": 901173770, "value": 6.73, "x": 138}, {"variable": "Population 25 years and over", "location_name": "Stratford", "fips": 900174190, "value": 10.28, "x": 139}, {"variable": "Population 25 years and over", "location_name": "Suffield", "fips": 900374540, "value": 8.49, "x": 140}, {"variable": "Population 25 years and over", "location_name": "Thomaston", "fips": 900575730, "value": 9.78, "x": 141}, {"variable": "Population 25 years and over", "location_name": "Thompson", "fips": 901575870, "value": 14.46, "x": 142}, {"variable": "Population 25 years and over", "location_name": "Tolland", "fips": 901376290, "value": 7.32, "x": 143}, {"variable": "Population 25 years and over", "location_name": "Torrington", "fips": 900576570, "value": 11.86, "x": 144}, {"variable": "Population 25 years and over", "location_name": "Trumbull", "fips": 900177200, "value": 6.63, "x": 145}, {"variable": "Population 25 years and over", "location_name": "Union", "fips": 901377830, "value": 3.05, "x": 146}, {"variable": "Population 25 years and over", "location_name": "Vernon", "fips": 901378250, "value": 9.24, "x": 147}, {"variable": "Population 25 years and over", "location_name": "Voluntown", "fips": 901178600, "value": 14.55, "x": 148}, {"variable": "Population 25 years and over", "location_name": "Wallingford", "fips": 900978740, "value": 8.84, "x": 149}, {"variable": "Population 25 years and over", "location_name": "Warren", "fips": 900579510, "value": 5.94, "x": 150}, {"variable": "Population 25 years and over", "location_name": "Washington", "fips": 900579720, "value": 3.56, "x": 151}, {"variable": "Population 25 years and over", "location_name": "Waterbury", "fips": 900980070, "value": 17.08, "x": 152}, {"variable": "Population 25 years and over", "location_name": "Waterford", "fips": 901180280, "value": 7.75, "x": 153}, {"variable": "Population 25 years and over", "location_name": "Watertown", "fips": 900580490, "value": 9.02, "x": 154}, {"variable": "Population 25 years and over", "location_name": "Westbrook", "fips": 900781680, "value": 10.63, "x": 155}, {"variable": "Population 25 years and over", "location_name": "West Hartford", "fips": 900382590, "value": 5.13, "x": 156}, {"variable": "Population 25 years and over", "location_name": "West Haven", "fips": 900982870, "value": 11.86, "x": 157}, {"variable": "Population 25 years and over", "location_name": "Weston", "fips": 900183430, "value": 0.62, "x": 158}, {"variable": "Population 25 years and over", "location_name": "Westport", "fips": 900183500, "value": 4.02, "x": 159}, {"variable": "Population 25 years and over", "location_name": "Wethersfield", "fips": 900384900, "value": 10.13, "x": 160}, {"variable": "Population 25 years and over", "location_name": "Willington", "fips": 901385950, "value": 7.24, "x": 161}, {"variable": "Population 25 years and over", "location_name": "Wilton", "fips": 900186370, "value": 3.34, "x": 162}, {"variable": "Population 25 years and over", "location_name": "Winchester", "fips": 900586440, "value": 11.41, "x": 163}, {"variable": "Population 25 years and over", "location_name": "Windham", "fips": 901586790, "value": 20.07, "x": 164}, {"variable": "Population 25 years and over", "location_name": "Windsor", "fips": 900387000, "value": 5.54, "x": 165}, {"variable": "Population 25 years and over", "location_name": "Windsor Locks", "fips": 900387070, "value": 11.16, "x": 166}, {"variable": "Population 25 years and over", "location_name": "Wolcott", "fips": 900987560, "value": 9.69, "x": 167}, {"variable": "Population 25 years and over", "location_name": "Woodbridge", "fips": 900987700, "value": 5.35, "x": 168}, {"variable": "Population 25 years and over", "location_name": "Woodbury", "fips": 900587910, "value": 6.23, "x": 169}, {"variable": "Population 25 years and over", "location_name": "Woodstock", "fips": 901588190, "value": 7.46, "x": 170}, {"variable": "Population 25 years and over", "location_name": "New District", "fips": 999, "value": 0.0, "x": 171}, {"variable": "Population 25 years and over", "location_name": "Ansonia School", "fips": 900901220, "value": 0.0, "x": 172}, {"variable": "Population 25 years and over", "location_name": "Ansonia School District", "fips": null, "value": 0.0, "x": 173}], "success": true, "min": 0.0}'
  ).data


function close_popup(){
  $('.close_popup').on('click',function() {
    $(this).closest('div.modal').modal('hide');
  });
}

function draw_graph(){
  $('#container').html('');
  var spec = {
    "width": 700,
    "height": data_items.length * 10,
    // "padding": {"top": 100, "left": 100, "bottom": 300, "right": 100},
    "data": [{"name": "table"}],
    "scales": [
      {
        "name": "x", "type": "linear", "range": "width", "nice": true ,"sort": true, //, "domainMin": min, "domainMax": max,
        "domain": {"data": "table", "field": "data.value"}
      },
      {
        "name": "y", "type": "ordinal", "range": "height", "sort": true,
        "domain": {"data": "table", "field": "data.location_name"}
      },
      {
        "name": "c",
        "type": "ordinal",
        "domain": {"data": "table", "field": "data.variable"},
        "range": ["#4670A7", "#080"]
      }
    ],
    "axes": [
      {"type": "x", "scale": "x", "orient": "top", "offset": 0, "grid": true, "sort": true,"layer": "back","titleOffset": 50, "ticks": 25, "title": x_axe_name,
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
             "align": {"value": "right"},
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
      {"type": "y", "scale": "y", "grid": true, "title": y_axe_name,
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
             "baseline": {"value": "middle"}
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
      "title": "Variable",
      "offset": 0,
      "properties": {
        "symbols": {
          "fillOpacity": {"value": 0.8},
          "stroke": {"value": "transparent"}
        }
      }
    }],
    "marks": [
      {
        "type": mark_type,
        "from": {"data": "table"},
        "properties": {
          "enter": {
            "x": {"scale": "x", "field": "data.value" },
            "y": {"scale": "y", "field": "data.location_name"},
            "fill": {"scale": "c", "field": "data.variable"},
            "fillOpacity": {"value": 0.8},
            "size": {"value": 100},
          },
          "update": {
            "size": {"value": 100},
          },
          "hover": {
            "size": {"value": 300},
          }
        }
      },

      {
        "type": 'text',
        "from": {"data": "table"},
        "properties": {
          "enter": {
            "x": {"scale": "x", "field": "data.value" },
            "y": {"scale": "y", "field": "data.location_name"},
            "fill": {"value": "#000"},
            "fillOpacity": {"value": 0},
            "dy": {"value": -10},
            "dx": {"value": -13},
            "fontWeight": {"value": 900},
            "fontSize": {"value": 14},
            "text": {"field": "data.label"},
          },
          "update": {

            "fillOpacity": {"value": 0}
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
            "x": {"scale": "x", "field": "data.value", "offset": 0},
            "y": {"scale": "y", "field": "data.x", "offset": 0},
            "fill": {"value": "transparent"},
            "strokeWidth": {"value": 2},
          },
            "update": {
            "size": {"value": 100},
          },
            "hover": {
            "size": {"value": 100},
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
          x_axe_name = "Value"
          y_axe_name = ""

          draw_graph();
          $('#select_uniq_values_popup').modal('hide');
      }else{
        $('#container').html('There is no available data to show')
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
        '<li class="dim_value"><label><input type="radio" name="'+ without_spaces+ '"value="' + value + '">'+value+'</lablel></li>'
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
  main_id = $main_dataset_select.val()
  compare_id = $compare_with_select.val()
  return $('ul').find('input:checked').map(function(i, e) {
      return {field: $(e).attr('name').replace(main_id + '_', '').replace(compare_id + '_', ''), values: [$(e).val()]}
  }).get();
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
          x_axe_name = $(ui.draggable).text(); break;
        case "y":
          y_axe_name = $(ui.draggable).text(); break;
        case "color":
          color = $(ui.draggable).text(); break;
        case "size":
          size  = $(ui.draggable).text(); break;
        case "shape":
          shape = $(ui.draggable).text(); break;
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
    $(this).closest('li').closest('div').removeClass('dropped')
    $("#matches ul").append($li )
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

    compare_dataset_data = comparable.filter(function( item) {
                          if (item['dataset_name'] == $("select#compare_with").val())
                            return item
                        })[0]

    addScale(main_geo_type)
    show_matches_in_popup(matches[$(this).val()])
    show_non_matches_for_main_dataset_in_popup(compare_dataset_data.main_no_matches)
    show_non_matches_for_comapre_dataset_in_popup(compare_dataset_data.no_matches)

    check_first_inputs()
    $('#select_uniq_values_popup').modal('show');
  });

  $('#continue_button').on('click', function(){
    get_data();
  })

  draw_graph();

  $('.update-filters').on('click', function(){
    $('#select_uniq_values_popup').modal('show');
  })

})
