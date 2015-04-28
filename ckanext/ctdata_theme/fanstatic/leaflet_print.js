// //require '/common/js/leaflet-src.js'

// L.Control.EasyPrint = L.Control.extend({
//     options: {
//         position: 'topleft',
//         title: 'Print map',
//     },

//     onAdd: function () {
//         var container = L.DomUtil.create('div', 'leaflet-control-easyPrint leaflet-bar leaflet-control');
//         $('head').append('<style type="text/css" media="print">\
//           html {padding: 0px!important;}\
//           .leaflet-control-easyPrint-button{display: none!important;}\
//           .info h4 {  margin: 0 0 5px; color: #777;}\
//           .legend { line-height: 15px; color: #555;}\
//           .legend i {\
//               width: 15px;\
//               height: 15px;\
//               float: left;\
//               margin-right: 8px;\
//               display: block;\
//               background-size:16px 16px;\
//           }</style>');

//         this.link = L.DomUtil.create('a', 'leaflet-control-easyPrint-button leaflet-bar-part', container);
//         this.link.href = 'javascript:void(0)($("#map").print({stylesheet:"/common/css/visualization.css"}))';

//         return container;
//     },


//     _click: function (e) {
//         L.DomEvent.stopPropagation(e);
//         L.DomEvent.preventDefault(e);
//     },
// });

// L.easyPrint = function() {
//   return new L.Control.EasyPrint();
// };