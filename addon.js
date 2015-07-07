(function () {

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

    console.log('initialized');

    // Just a small shortcut to repeat myself less
    var $$ = document.getElementById.bind(document);

    // Get the system tray bar
    var statusBarEl = $$('statusbar-maximized');

    // If there is a old one, remove it first
    var containerEl = $$('statusbar-temperature');
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
    containerEl.textContent = '-99℃';

    // Append the temperature element to the system tray bar
    statusBarEl.appendChild(containerEl);

    // Crete a XHR to load the temperature
    var xhr = new XMLHttpRequest({
      mozAnon: true,
      mozSystem: true
    });

    // We want our response in JSON format
    xhr.responseType = 'json';

    // On successful request, display new temperature
    xhr.onload = function () {
      if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        containerEl.textContent = Math.round(parseFloat(xhr.response.main.temp) - 273.15) + '℃';
      }
    }

    // Watch our geo position and update the temperature if it changes
    //TODO: this should be enhanced to poll in intervalls if the location did not change and to wait if the location changes to often
    watchId = navigator.geolocation.watchPosition(function(position){
      xhr.open('GET', 'http://api.openweathermap.org/data/2.5/weather?q=' + position.coords.latitude + ',' + position.coords.longitude, true);
      xhr.send();
    }, function(msg) {
    }, {
      enableHighAccuracy: false
    });

  }

}());


