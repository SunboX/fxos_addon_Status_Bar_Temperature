(function () {

  var APPID = 'O4GC0pHV34H398TVVDX165LTYGF38qS3qOgzc2oc0ftXHD2yujGGg1e4fNI.2bi_czY1FA--'; // Your Yahoo Application ID
  var DEG = 'c'; // c for celsius, f for fahrenheit
  var UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutes

  // If injecting into an app that was already running at the time
  // the app was enabled, simply initialize it.
  if (document.documentElement) {
    initialize();
  }

  // Otherwise, we need to wait for the DOM to be ready before
  // starting initialization since add-ons are usually (always?)
  // injected *before* `document.documentElement` is defined.
  else {
    window.addEventListener('DOMContentLoaded', initialize);
  }

  function initialize() {

    // Get the status bar bar
    var statusBarEl = document.getElementById('statusbar-maximized');

    // If there is a old one, remove it first
    var containerEl = document.getElementById('statusbar-temperature');
    if (containerEl) {
      statusBarEl.removeChild(containerEl);
    }

    // Build the temperature element
    containerEl = document.createElement('div');
    containerEl.setAttribute('id', 'statusbar-temperature');
    containerEl.style.order = '-2';
    containerEl.style.fontSize = '1.5rem';
    containerEl.style.fontWeight = '400';
    containerEl.style.lineHeight = '1.6rem';
    containerEl.textContent = '-99' + String.fromCharCode(DEG === 'c' ? 8451 : 8457);

    // Append the temperature element to the status bar
    statusBarEl.appendChild(containerEl);

    // Crete a XHR to load the temperature
    var xhr = new XMLHttpRequest({
      mozAnon: true, // tells the User Agent not to pass cookies and other auth information along with the request
      mozSystem: true // allows to do Cross-Domain requests, not really needed here
    });

    // We want our response in JSON format
    xhr.responseType = 'json';

    // On successful request, display new temperature
    xhr.onload = function () {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200 && xhr.response.query.count == 1) {

        // Update the temperature element
        var item = xhr.response.query.results.channel.item.condition;

        containerEl.textContent = Math.round(parseFloat(item.temp)) + String.fromCharCode(DEG === 'c' ? 8451 : 8457);
      }
    }

    var didRunFirst = false, lat, lng;

    function queryCurrentTemp() {
      // Forming the query for Yahoo's weather forecasting API with YQL
      // http://developer.yahoo.com/weather/
      var wsql = 'select * from weather.forecast where woeid in (SELECT woeid FROM geo.placefinder WHERE text="' + lat + ',' + lng + '" and gflags="R") and u="' + DEG + '"',
          weatherYql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(wsql) + '&format=json';

      xhr.open('GET', weatherYql, true);
      xhr.send();
    }

    // Watch our geo position and update the temperature if it changes
    var watchId = navigator.geolocation.watchPosition(function (position) {
      lat = position.coords.latitude;
      lng = position.coords.longitude;

      if (!didRunFirst) {
        didRunFirst = true;
        queryCurrentTemp();
      }

    }, function (error) {
      console.log(error);
      switch (error.code) {
        case error.TIMEOUT:
          queryCurrentTemp(); // A timeout occured, try again.
          break;
        case error.POSITION_UNAVAILABLE:
          // We can't detect the location
          break;
        case error.PERMISSION_DENIED:
          statusBarEl.removeChild(containerEl); // geolocation access is not allowed
          break;
        case error.UNKNOWN_ERROR:
          // An unknown error occured
          break;
      }

    }, {
      enableHighAccuracy: false,
      timeout: 10 * 1000, // time out after 10 seconds
      maximumAge: UPDATE_INTERVAL
    });

    // Update all 10 Minutes, even if position did not change
    setInterval(queryCurrentTemp, UPDATE_INTERVAL);

  }

}());
