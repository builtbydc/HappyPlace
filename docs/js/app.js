//map initialization script
let map;

let heatMapEnabled = false;

let sortDirection = false;

let weatherData = {};

var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};
let global_lat = -34.397;
let global_lng = 150.644;
let global_zoom = 8;
function success(pos) {
    var crd = pos.coords;
    global_lat = crd.latitude;
    global_lng = crd.longitude;
    initMap(crd.latitude, crd.longitude);
}

function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
    initMap(global_lat, global_lng);
}

navigator.geolocation.getCurrentPosition(success, error, options);

function initMap(lat, long) {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: lat, lng: long },
        zoom: 8,
        minZoom: 2,
        panControl: true,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        overviewMapControl: true,
        rotateControl: true,
        fullscreenControl: false
    });
    if (heatMapEnabled) {
        var heatMap = new google.maps.ImageMapType({
            getTileUrl: function (coord, zoom) {
                return "https://tile.openweathermap.org/map/temp_new/" +
                    zoom + "/" + coord.x + "/" + coord.y + ".png?appid=" + key;
            },
            tileSize: new google.maps.Size(256, 256),
            maxZoom: 9,
            minZoom: 2,
            name: 'heatMap'
        });

        map.overlayMapTypes.insertAt(0, heatMap);
    }
}

//key for  open weather map
// const key = '5bc768cc9df2685fbc7ab678cfaeb95e';
const key = '431a4a6cc1ba0a9c9b9ac7071f861685'

//url for searching by city id
const city_id_url = (id) =>
    `https://api.openweathermap.org/data/2.5/weather?units=imperial&id=${id}&appid=${key}`;

const forecast_city_id_url = (id) =>
    `https://api.openweathermap.org/data/2.5/forecast?units=imperial&cnt=40&id=${id}&appid=${key}`;

const temp_map_url = (z, x, y) =>
    `https://tile.openweathermap.org/map/temp_new/${z}/${x}/${y}.png?appid=${key}`;

let populate = function (data) {
    weatherData[data.id] = data;
    $list_obj = $("<div></div>").attr("id", data.id)
        .addClass("city-list-item");

    $city = $("<div></div>").attr("id", data.id + "-name")
        .addClass("city-name")
        .text(data.name)
        .appendTo($list_obj);

    $temp = $("<div></div>").attr("id", data.id + "-temp")
        .addClass("city-temp")
        .html(Math.ceil(data.main.temp) + "&#176;")
        .appendTo($list_obj);

    $desc = $("<div></div>").attr("id", data.id + "-desc")
        .addClass("city-desc")
        .text(data.weather[0].description)
        .appendTo($list_obj);

    $frcst = $("<div></div>").attr("id", data.id + "-forecast")
        .addClass("city-forecast")
        .hide()
        .appendTo($list_obj);

    $list_obj.appendTo("#left-panel");
}

let getDataByCityId = function (id) {
    let url = city_id_url(id)
    //console.log(url);
    $.get(url, function (wdata) {
        //console.log(wdata);
        populate(wdata);
    });
}

let getForecastByCityId = function (id) {
    let url = forecast_city_id_url(id);
    //console.log(url);
    $.get(url, function (wdata) {
        console.log(wdata);
        let noon = 0;
        for (let x in wdata.list) {
            let thisData = wdata.list[x];
            if (thisData.dt_txt.includes("12:00:00")) {
                noon = parseInt(x);
                break;
            }
        }
        console.log("Noon index: " + noon)
        for (let y = noon; y < 40; y += 8) {
            thisData = wdata.list[y];
            console.log("Index: " + y);
            console.log(thisData.dt_txt);
            console.log(Math.ceil(thisData.main.temp));
            console.log(thisData.weather[0].main);
            console.log();
            let baseID = id + "-fd-" + (y).toString();
            $day = $("<div></div>")
                .addClass("forecast-item")
                .attr("id", baseID);

            $temp = $("<div></div>")
                .attr("id", baseID + "-temp")
                .addClass("fd-temp")
                .text(Math.ceil(thisData.main.temp))
                .appendTo($day);

            $weather = $("<div></div>")
                .attr("id", baseID + "-weather")
                .addClass("fd-weather")
                .text(thisData.weather[0].main)
                .appendTo($day);

            $dayName = $("<div></div>")
                .attr("id", baseID + "-day")
                .addClass("fd-day")
                .text(new Date(thisData.dt * 1000).toLocaleString('en-us', { weekday: 'short' }))
                .appendTo($day);

            $day.appendTo("#" + id + "-forecast");
            $("#" + id + "-forecast").show();
        }

    });
}

let sortBy = function (typ, dir) {
    sortDirection = !sortDirection;
    console.log("sorting by: " + typ);
    var result = $(".city-list-item").sort(function (a, b) {
        let selector = "";
        switch (typ) {
            case "temp":
                selector = ".city-temp";
                break;
            case "name":
                selector = ".city-name";
                break;
            case "weather":
                selector = ".city-desc";
                break;
            default:
                break;
        }
        var contentA = $(selector, a).text();
        var contentB = $(selector, b).text();
        console.log("comparing: " + contentA + " | " + contentB);
        if (typ == "temp") {
            contentA = parseInt(contentA);
            contentB = parseInt(contentB);
        }
        if (dir)
            return (contentA < contentB) ? 1 : (contentA > contentB) ? -1 : 0;
        else
            return (contentA < contentB) ? -1 : (contentA > contentB) ? 1 : 0;
    });
    console.log(result);
    $("#left-panel").empty();
    $(result).appendTo("#left-panel");
}

$.getJSON("./js/default_list.json", function (json) {
    for (let loc in json) {
        //console.log(json[loc])
        getDataByCityId(json[loc].id);
    }
    sortBy("temp", sortDirection);
});

$("#left-panel").on('click', '.city-list-item', function () {
    data = weatherData[$(this).attr("id")];
    //console.log(data);
    const center = new google.maps.LatLng(data.coord.lat, data.coord.lon);
    map.panTo(center);

    global_lat = data.coord.lat;
    global_lng = data.coord.lon;

    var marker = new google.maps.Marker({
        position: center,
        title: data.name
    });

    let deactivate = $(this).hasClass("active");
    $(".city-list-item.active").removeClass("active");
    $(".city-forecast").each(function () {
        $(this).empty().hide();
    });

    if (!deactivate) {
        $(this).addClass("active");
        marker.setMap(map);
        getForecastByCityId(data.id);
    }

    // To add the marker to the map, call setMap();

})

$("#sort-arrow").click(function () {
    $(this).toggleClass("open");
    if ($(this).hasClass("open")) {
        $(".option").each(function () {
            $(this).show();
        });
    }
    else {
        $(".option").each(function () {
            $(this).hide();
        });
    }
});

$(".option").click(function () {

    $("#sort-arrow").removeClass("open");
    $(".option").each(function () {
        $(this).hide();
    });
    $(".option.active").removeClass("active");
    $(this).addClass("active");
    let sortType = $(this).attr("sort");
    sortBy(sortType, sortDirection);
});

$("#heatMapToggle").click(function () {
    $(this).toggleClass("enabled");
    heatMapEnabled = !heatMapEnabled;
    initMap(global_lat, global_lng);
});

function registerServiceWorker() {

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(function (registration) {
                // Registration was successful
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }).catch(function (err) {
                // registration failed :(
                console.log('ServiceWorker registration failed: ', err);
            });
    }

}