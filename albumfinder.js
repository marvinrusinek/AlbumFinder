/*
 1. Click 'Fork' from the top menu and generate your own JSFiddle link. Add all your code below the instructions. Be sure to click 'Update' when your work is done.

 2. Create an Angular application. Call it 'AlbumFinder'.

 3. Create a Controller, call it 'AlbumsController'. Use this controller however you see fit.

 4. Create a Service called 'iTunesService' that calls the iTunes API (the API path is given below). Replace ARTIST_NAME within the API path with the search phrase coming from the user input field.

 5. When the Search button is clicked, make a call to the API and display the list of albums, including the album name and album cover inside .albums-container in a grid. Use any CSS technique you are comfortable with (Note: The API will return a list of albums based on the search result. Use your skills to find out what the iTunes API data structure looks like and extract the relevant data from it).

 6. BONUS: Make the grid look presentable and aesthetically pleasing.

 7. BONUS: How would you improve the User Experience?

 8. Click 'Update' from the top menu and share the link.
*/
var app = angular.module('AlbumFinder', ['ui.grid', 'ui.grid.pagination', 'ui.grid.exporter']);

app.controller('AlbumsController', function($scope, iTunesService) {
    //$scope.searchPhrase = "Jay Z";

    var parseAlbums = function(albums) {
        var finalAlbums = [];

        for(var i = 0; i < albums.length; i++) {
            var relevantAlbumData = {};
            relevantAlbumData['View'] = albums[i].collectionViewUrl;
            relevantAlbumData['Artist'] = albums[i].artistName;
            relevantAlbumData['Collection'] = albums[i].collectionName;
            relevantAlbumData['AlbumArt'] = albums[i].artworkUrl100;
            relevantAlbumData['Type'] = albums[i].collectionType;
            relevantAlbumData['Genre'] = albums[i].primaryGenreName;
            relevantAlbumData['ReleaseDate'] = albums[i].releaseDate.slice(0,10);
            relevantAlbumData['CollectionPrice'] = "$" + albums[i].collectionPrice;
            finalAlbums.push(relevantAlbumData);
        }
        return finalAlbums;
    };

    $scope.getAlbumData = function() {
        $scope.searchPhrase = $scope.searchPhrase.split(' ').join('');
        iTunesService.getAlbums($scope.searchPhrase)
            .then(function(data) {
                $scope.albumData = parseAlbums(data.data.results)
            });
    }

    $scope.gridOptions = {
        data: 'albumData',
        rowHeight: 110,
        enableSorting: true,
        enableFiltering: true,
        enableGridMenu: true,
        enableSelectAll: true,

        // pagination settings
        paginationPageSizes: [25, 50, 75],
        paginationPageSize: 10,

        // exporterCsv grid options
        exporterCsvFilename: 'AlbumFinder.csv',
        exporterCsvLinkElement: angular.element(document.querySelectorAll(".custom-csv-link-location")),

        // exporterPdf grid options
        exporterPdfDefaultStyle: { fontSize: 9 },
        exporterPdfTableStyle: { margin: [30, 30, 30, 30] },
        exporterPdfTableHeaderStyle: { fontSize: 10, bold: true, italics: true, color: 'red' },
        exporterPdfHeader: { text: "AlbumFinder Search Results", style: 'headerStyle' },
        exporterPdfFooter: function (currentPage, pageCount) {
            return { text: currentPage.toString() + ' of ' + pageCount.toString(), style: 'footerStyle' };
        },
        exporterPdfCustomFormatter: function(docDefinition) {
            docDefinition.styles.headerStyle = { fontSize: 22, bold: true };
            docDefinition.styles.footerStyle = { fontSize: 10, bold: true };
            return docDefinition;
        },
        exporterPdfOrientation: 'portrait',
        exporterPdfPageSize: 'LETTER',
        exporterPdfMaxGridWidth: 500,

        // exporterExcel grid options
        exporterExcelFilename: 'AlbumFinder.xlsx',
        exporterExcelSheetName: 'Sheet1',
        exporterExcelCustomFormatters: function(grid, workbook, docDefinition) {
            var stylesheet = workbook.getStyleSheet();
            var stdStyle = stylesheet.createFontStyle({
                size: 9, fontName: 'Calibri'
            });
            var boldStyle = stylesheet.createFontStyle({
                size: 9, fontName: 'Calibri', bold: true
            });
            var aFormatDefn = {
                "font": boldStyle.id,
                "alignment": { "wrapText": true }
            };
            var formatter = stylesheet.createFormat(aFormatDefn);
            // save the formatter
            $scope.formatters['bold'] = formatter;

            aFormatDefn = {
                "font": stdStyle.id,
                "fill": { "type": "pattern", "patternType": "solid", "fgColor": "FFC7CE" },
                "alignment": { "wrapText": true }
            };

            var singleDefn = {
                font: stdStyle.id,
                format: '#,##0.0'
            };
            formatter = stylesheet.createFormat(aFormatDefn);
            // save the formatter
            $scope.formatters['red'] = formatter;

            Object.assign(docDefinition.styles , $scope.formatters);

            return docDefinition;
        },
        exporterExcelHeader: function(grid, workbook, sheet, docDefinition) {
            // this can be defined outside this method
            var stylesheet = workbook.getStyleSheet();
            var aFormatDefn = {
                "font": { "size": 11, "fontName": "Calibri", "bold": true },
                "alignment": { "wrapText": true }
            };
            var formatterId = stylesheet.createFormat(aFormatDefn);

            // excel cells start with A1 which is upper left corner
            sheet.mergeCells('B1', 'C1');
            var cols = [];
            // push empty data
            cols.push({ value: '' });
            // push data in B1 cell with metadata formatter
            cols.push({ value: 'My header that is long enough to wrap', metadata: {style: formatterId.id} });
            sheet.data.push(cols);
        },
        exporterFieldFormatCallback: function(grid, row, gridCol, cellValue) {
            // set metadata on export data to set format id. See exportExcelHeader config above for example of creating
            // a formatter and obtaining the id
            var formatterId = null;
            if (cellValue && typeof cellValue === 'string' && cellValue.startsWith('W')) {
                formatterId = $scope.formatters['red'].id;
            }

            if (formatterId) {
                return {metadata: {style: formatterId}};
            } else {
                return null;
            }
        },
        onRegisterApi: function(gridApi) {
            $scope.gridApi = gridApi;
        },
        columnDefs: [
            { field: 'View', displayName: 'View', width: 60, cellTemplate: '<div class="ui-grid-cell-contents ng-binding ng-scope" ng-class="col.colIndex()"><a ng-href="{{grid.getCellValue(row, col)}}"><img src="https://images.onlinelabels.com/images/clip-art/emyller/emyller_magnifying_glass.png" height="30px" width="30px" lazy-src /></a></div>' },
            { field: 'Artist', displayName: 'Artist' },
            { field: 'Collection', displayName: 'Album Name' },
            { field: 'AlbumArt', displayName: 'Album Cover', cellTemplate: '<div class="ui-grid-cell-contents ng-binding ng-scope" ng-class="col.colIndex()"><img ng-src="{{grid.getCellValue(row, col)}}" lazy-src /></div>' },
            { field: 'Type', displayName: 'Type' },
            { field: 'Genre', displayName: 'Genre' },
            { field: 'ReleaseDate', displayName: 'Release Date', sort: { direction: 'desc', priority: 0 } },
            { field: 'CollectionPrice', displayName: 'Album Price' }
        ]
    };
});

app.service('iTunesService', function($http, $q) {
    this.getAlbums = function(artist) {
        var API_BASE = 'https://itunes.apple.com/search?entity=album&term=';
        return $http({
            method: "JSONP",
            url: API_BASE + artist + '&callback=JSON_CALLBACK'
        })
    }
});

$('#searchPhrase').keydown(function(event) {
    var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;
    if (key == 13) {
        $(".btn").click();
    }
});



/* QUESTION #7: As an AngularJS developer, one way I would enhance the user experience/usability of the AlbumFinder application is by adding an additional filter input, i.e., a radio button or dropdown menu, to the search where users could select singles only or albums with more than one track. This could be useful for those looking only to purchase albums with more than one song on it and there is a number of tracks property in the JSON file which could used for this purpose.  The UI could be enhanced through the use of AngularJS Material within the application for the layout and stylization of the webpage.  The addition of a hover property on the album name could display a blurb with a short description of the band/artist and other pertinent info such as year the band/artist formed and place of origin. This would help users deciding whether to buy an album or not without having to click through the View icon and scanning a landing page for particular info. For instance, if I were searching for the artist Pearl Jam, I may be interested in knowing when a certain album was released, this information could be extracted from the JSON file and potentially be another column in the grid. I would add an "alt" attribute to the cover photo to help those with visual disabilities. In addition, the inclusion of a pagination feature at the bottom of the grid may help users searching for artists with a lot of albums (for example, having 10/15/20 album entries per page). I would add a shopping cart feature with a shopping cart glyphicon link as the last column for users wishing to purchase particular album(s). Finally, I would test the application for consistency across multiple browsers and check the responsiveness of the application on various mobile devices. For instance, on smaller devices, only the album cover, album name, and View icon columns would be displayed and should scale to the width of the device. */