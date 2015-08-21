(function() {
    var APPID = 'O4GC0pHV34H398TVVDX165LTYGF38qS3qOgzc2oc0ftXHD2yujGGg1e4fNI.2bi_czY1FA--'; // Your Yahoo Application ID

    var currentUpdateInterval = 10 * 60 * 1000; // 10 minutes
    var currentDegreeFormat = 'c';
    var currentUpdateIntervalInterval;
    var watchId;

    // Show geolocation exceptions only once
    var notifiedAboutException = false;

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

    var statusBarEl, containerEl, xhr, didRunFirst = false,
        lat, lng;

    function initialize() {

        // Get the status bar bar
        statusBarEl = document.getElementById('statusbar-maximized');

        // If there is a old one, remove it first
        var containerEls = statusBarEl.querySelectorAll('.statusbar-temperature');
        for (var i = 0; i < containerEls.length; i++) {
            statusBarEl.removeChild(containerEls[i]);
        }

        // Build the temperature element
        containerEl = document.createElement('div');
        containerEl.classList.add('statusbar-temperature');
        containerEl.style.order = '-2';
        containerEl.style.fontSize = '1.5rem';
        containerEl.style.fontWeight = '400';
        containerEl.style.lineHeight = '1.6rem';
        containerEl.textContent = '-99' + String.fromCharCode(currentDegreeFormat === 'c' ? 8451 : 8457);

        // Crete a XHR to load the temperature
        xhr = new XMLHttpRequest({
            mozAnon: true, // tells the User Agent not to pass cookies and other auth information along with the request
            mozSystem: true // allows to do Cross-Domain requests, not really needed here
        });

        // We want our response in JSON format
        xhr.responseType = 'json';

        // On successful request, display new temperature
        xhr.onload = function() {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200 && xhr.response.query.count == 1) {

                // Update the temperature element
                var item = xhr.response.query.results.channel.item.condition;

                containerEl.textContent = Math.round(parseFloat(item.temp)) + String.fromCharCode(currentDegreeFormat === 'c' ? 8451 : 8457);

                // If it's not already there, append the temperature element to the status bar
                if (!statusBarEl.contains(containerEl)) {

                    // If there is a old one, remove it first
                    var containerEls = statusBarEl.querySelectorAll('.statusbar-temperature');
                    for (var i = 0; i < containerEls.length; i++) {
                        statusBarEl.removeChild(containerEls[i]);
                    }

                    statusBarEl.appendChild(containerEl);
                }
            }
        };

        // Update all 10 Minutes, even if position did not change
        currentUpdateIntervalInterval = setInterval(queryCurrentTemp, currentUpdateInterval);

        var settings = window.navigator.mozSettings;

        // Get degree format
        var reqDegreeFormat = settings.createLock().get('statusbar-temperature.degree-format');

        reqDegreeFormat.onsuccess = function() {
            currentDegreeFormat = reqDegreeFormat.result['statusbar-temperature.degree-format'];
            queryCurrentTemp();
        };

        // Listen to changes on the degree format setting
        settings.addObserver('statusbar-temperature.degree-format', function(event) {
            if (currentDegreeFormat !== event.settingValue) {
                currentDegreeFormat = event.settingValue;
                queryCurrentTemp();
            }
        });

        // Get update interval
        var reqUpdateInterval = settings.createLock().get('statusbar-temperature.update-interval');

        reqUpdateInterval.onsuccess = function() {
            currentUpdateInterval = reqUpdateInterval.result['statusbar-temperature.update-interval'] * 60 * 1000;

            // Watch our geo position and update the temperature if it changes
            startWatching();
        };

        reqUpdateInterval.onerror = function() {
            // Watch our geo position and update the temperature if it changes
            startWatching();
        };

        // Listen to changes on the degree format setting
        settings.addObserver('statusbar-temperature.update-interval', function(event) {
            var newUpdateInterval = event.settingValue * 60 * 1000;
            if (currentUpdateInterval !== newUpdateInterval) {

                currentUpdateInterval = newUpdateInterval;

                clearInterval(currentUpdateIntervalInterval);
                currentUpdateIntervalInterval = setInterval(queryCurrentTemp, currentUpdateInterval);

                navigator.geolocation.clearWatch(watchId);
                startWatching();
            }
        });
    }

    function startWatching() {
        watchId = navigator.geolocation.watchPosition(function(position) {
            lat = position.coords.latitude;
            lng = position.coords.longitude;

            if (!didRunFirst) {
                didRunFirst = true;
                queryCurrentTemp();
            }

        }, function(error) {
            console.log(error);
            switch (error.code) {
                case error.TIMEOUT:
                    // A timeout occured, wait and than try again.
                    break;
                case error.POSITION_UNAVAILABLE:
                    // We can't detect the location
                    break;
                case error.PERMISSION_DENIED:
                    if (statusBarEl.contains(containerEl)) {
                        statusBarEl.removeChild(containerEl); // geolocation access is not allowed
                    }
                    if (!notifiedAboutException) {
                        notifiedAboutException = true;
                        var notification = notify('Status Bar Temperature', 'Please make sure you have enabled geolocation and confirm the prompt.');
                        notification.onclick = function() {
                            var activity = new MozActivity({
                                name: 'configure',
                                data: {
                                    target: 'device',
                                    section: 'geolocation'
                                }
                            });
                        };
                    }
                    startWatching();
                    break;
                default: // UNKNOWN_ERROR
                    // An unknown error occured
                    break;
            }

        }, {
            enableHighAccuracy: false,
            timeout: 10 * 1000, // time out after 10 seconds
            maximumAge: currentUpdateInterval
        });
    }

    function queryCurrentTemp() {
        xhr.abort();

        // Forming the query for Yahoo's weather forecasting API with YQL
        // http://developer.yahoo.com/weather/
        var wsql = 'select * from weather.forecast where woeid in (SELECT woeid FROM geo.placefinder WHERE text="' + lat + ',' + lng + '" and gflags="R") and u="' + currentDegreeFormat + '"',
            weatherYql = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(wsql) + '&format=json';

        xhr.open('GET', weatherYql, true);
        xhr.send();
    }

    function notify(title, body) {
        // Let's check if the browser supports notifications
        if (!('Notification' in window)) {
            alert('This browser does not support notifications');
        }

        // Let's check whether notification permissions have alredy been granted
        else if (Notification.permission === 'granted') {
            // If it's okay let's create a notification
            var notification = new window.Notification(title, {
                body: body,
                icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyxpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NjcyOSwgMjAxMi8wNS8wMy0xMzo0MDowMyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIEVsZW1lbnRzIDEyLjAgTWFjaW50b3NoIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjFCMEVGNTU0MUVBNTExRTU5NEI2ODU0M0ZDNzNFQ0Y2IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjFCMEVGNTU1MUVBNTExRTU5NEI2ODU0M0ZDNzNFQ0Y2Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MDc5MDQyN0YxRUE1MTFFNTk0QjY4NTQzRkM3M0VDRjYiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MDc5MDQyODAxRUE1MTFFNTk0QjY4NTQzRkM3M0VDRjYiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4f9Jo+AAAFM0lEQVR42rRXa2wVRRT+Znfvo61W21JaeUioIQgFRJQKpMEAtqSNaaKAQmmQAPJIRUJMQ1ChRgnRmBBJtGJpeNgASiqQBgjE2CAJ/AE1Fl8BA2hf1FL6gD7ua8dvdi/NLe3tXgOeZHZmd8+cb86Z75ydFS8sWo27opkGIAWkZrKXbBpvJYQUaQJiLgfPU20yINLYu8PT/FRsZn+Jyt9LyBrOaeYcqtGO4ExTYy9hasE+LANDy1hO2yCEKOQ4lbP7XpimVDbZ1DPxBC+z+HoN9Vs4Psi2k+1aNMPa4I+lMlZMoxcVsA0aBmQken1+eDwuC9TH8T2SGl7sRWXDtjVQBvM4XkitnJOWDliOFX6J9a+/iimZ4xAKhXCw6hTOnv8RXq/nXvVkAe1T6s/kWO1nd1RgmnXRiUMELYh83tvrszw1TRNFi/IwcXwGtm7/HKNHpWPDmiVoaGrB9b8b4XIN5gcdEHiYthfyJhAt1GVs/UBDIRPLFr+IDzavQ9rwFEwg6NETNezHovVWBy7/+Rcyn8xAMBgaiisFYdsRe6zYJxXz9FW8ruofWps8PT0+3GrvsAilFqL6/JxsPDVpHPfbZ2+BgyjbCuMunuUxqT+Cww8HKAt7X1XvcbsjntukUl7arI5NFIbCsj0WllslHKcMJJMNosB9fj8egKRYWMTURMiVShYvG3SFfR4LeD1um34xhHVIr4mlMBlqOV9Rf9BsDnvsIaimaVZoFbPV+K7oHPv9ASu1YpRkhclQi3lRV0ePNU2g8usTeGdbGUaPTMPUKeNxq63DioQiWuftLuTnZiMpKRGBQDBGt8U8jeGe5KwnMGP6ZGx/txifVRxG7a9XkJL0CNMrGWV7qtDIPP6o9E243S4rIs7hxiR6jPShlJRnuqGjeOUiVFQew9XrDajYucXK46UL8/DeptXYUXYAd7q6sWTBfBYbfyz0TleblTCUjgpfJouGruv47uwFlBLo8VH2Wg0uaPasaVhZVID9h44je8ZUJCTExZLXCRqiVfGIyqWA6upvIJnhzRgzon/tpszMmoK29k7muguPJj6EkHO4pQK+4xAWq1bHx8exgvWSwQMJ1NHZFWa6QCAYVFXKCfiO0m4aSsNlGPjt8jWMCYf3yPGaPsKp5g8EUL7vG0yfNhEtrW1oJeN1XXMCbjJ4YrhEE89F01D7WNfQjPMXarGlZBVKtu5EfeM/mJP9LLq6e1B5+KTF5BWFBXj/44qY6gsxa0XOy8WL7U9hdFGG1X6+vXEFHksfht1fHkVT800WDx1Zz2Si6JV87D1QjWMnzyA+zusITGsLRe5Lb6RAk3/wfpgTyVR1KsibjXmzs6ycVXKztR1fHTmNn3+5Qh54YykfN0JSTjCkHmwlxyqlFButT1bUIqJbe1dVfQbVp85ZnqlI3Gb+aqqWx8XBicxCHRyBPWRAu6FIKk25I8GD5YZuJjktN97rssIuZQ90WklKNMIcDjmAAr6AuHG7W3yiSGlsKmpUiVyfFB/Y7NXNXff58Ykqui7R1Op+6/e6uBZdo+cNP8yxNzxk0W0fr6/9H8D05wtNk2sN3fbM8PWKyHCsZTecLe8Bw1ZJHethMu9NMehhr5dtATdt/wPDFCjn56iQLgecDvQ9JPdyTlinqH8fkPUEXMGivCbyWOvwJ2HtyS5OnMbRNt42/AfAOrZSGuBc7I0aiKvn5vajfN+nQx17rDOWOo2KZKZgLh/k8P5pvh0Z8TMQtBYm8BP701T/lv9qbbZbTDtNHZ1NZSPy1wv/CjAAvHUKIYY3QggAAAAASUVORK5CYII='
            });

            notification.onclick = function() {
                notification.close();
            };

            return notification;
        }

        // Otherwise, we need to ask the user for permission
        else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function(permission) {
                // If the user accepts, let's create a notification
                if (permission === 'granted') {
                    notify(title, body);
                }
            });
        }

        // At last, if the user has denied notifications, and you 
        // want to be respectful there is no need to bother them any more.
    }

}());
