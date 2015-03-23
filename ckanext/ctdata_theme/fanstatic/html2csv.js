jQuery.fn.table2CSV = function(options) {
    var options = jQuery.extend({
        separator: ',',
        header: [],
        delivery: 'popup' // popup, value
    },
    options);

    var csvData = [];
    var headerArr = [];
    var el = this;

    //header
    var numCols = options.header.length;
    var tmpRow = []; // construct header avalible array

    if (numCols > 0) {
        for (var i = 0; i < numCols; i++) {
            tmpRow[tmpRow.length] = formatData(options.header[i]);
        }
    } else {
        $(el).filter(':visible').find('th').each(function() {
            if ($(this).css('display') != 'none') tmpRow[tmpRow.length] = formatData($(this).html());
        });
    }

    row2CSV(tmpRow);

    // actual data
    $(el).find('tr').each(function() {
        var tmpRow = [];
        $(this).filter(':visible').find('td.for_csv').each(function() {
            if ($(this).css('display') != 'none') tmpRow[tmpRow.length] = formatData($(this).find('.for_csv').text());
        });

        row2CSV(tmpRow);
    });
    if (options.delivery == 'popup') {
        var mydata = csvData.join('\n');
        return popup(mydata);
    } else {
        var mydata = csvData.join('\n');
        return mydata;
    }

    function row2CSV(tmpRow) {
        var tmp = tmpRow.join('') // to remove any blank rows
        // alert(tmp);
        if (tmpRow.length > 0 && tmp != '') {
            var mystr = tmpRow.join(options.separator);
            mystr = mystr.replace(/\s\s/g, "");
            csvData[csvData.length] = mystr;
        }
    }
    function formatData(input) {
        // replace " with “
        var regexp = new RegExp(/["]/g);
        var output = input.replace(regexp, "“");
        //HTML
        var regexp = new RegExp(/\<[^\<]+\>/g);
        var output = output.replace(regexp, "");
        if (output == "") return '';
        return '"' + output + '"';
    }
    function popup(data) {
        // var generator = window.open('', 'csv', 'height=400,width=600');
        // generator.document.write('<html><head><title>CSV</title>');
        // generator.document.write('</head><body >');
        // generator.document.write('<textArea cols=70 rows=15 wrap="off" >');
        // generator.document.write(data);
        // generator.document.write('</textArea>');
        // generator.document.write('</body></html>');
        // generator.document.close();

        // var csvContent = "data:text/csv;charset=utf-8,";
        //     csvContent += data

        community_name = $('#default_profile_name').text()


        // var iev=0;
        // var ieold = (/MSIE (\d+\.\d+);/.test(navigator.userAgent));
        // var trident = !!navigator.userAgent.match(/Trident\/7.0/);
        // var rv=navigator.userAgent.indexOf("rv:11.0");

        // if (ieold) iev=new Number(RegExp.$1);
        // if (navigator.appVersion.indexOf("MSIE 10") != -1) iev=10;
        // if (trident&&rv!=-1) iev=11;


       if (navigator.appName == "Microsoft Internet Explorer" || "Netscape") {
            var oWin = window.open();
            oWin.document.write('sep=,\r\n' + data);
            oWin.document.close();
            oWin.document.execCommand('SaveAs', true, community_name + ".csv");
            oWin.close();
        }

        download = document.getElementById('download');
        download.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(data));
        download.setAttribute('download', community_name + '.csv');
        return true;
    }
};