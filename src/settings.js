(function() {

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

        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {

                if (mutation.attributeName === 'class' && mutation.target.classList.contains('current')) {
                    var addonDetailsHeader = mutation.target.querySelector('.addon-details-header');
                    var customSettings = mutation.target.querySelector('.status-bar-temp');

                    if (customSettings) {
                        customSettings.parentElement.removeChild(customSettings);
                        customSettings = null;
                    }

                    if (addonDetailsHeader.textContent === 'Status Bar Temperature') {

                        var settings = window.navigator.mozSettings;

                        customSettings = document.createElement('div');
                        customSettings.classList.add('status-bar-temp');

                        var header = document.createElement('header');
                        header.classList.add('status-bar-temp');

                        var h2 = document.createElement('h2');
                        h2.textContent = 'Settings';

                        header.appendChild(h2);
                        customSettings.appendChild(header);

                        var ul = document.createElement('ul');

                        var liTemperatureFormat = document.createElement('li');
                        var pTemperatureFormat = document.createElement('p');
                        pTemperatureFormat.textContent = 'Temperature Format';

                        var spanTemperatureFormat = document.createElement('span');
                        spanTemperatureFormat.classList.add('button');
                        spanTemperatureFormat.classList.add('icon');
                        spanTemperatureFormat.classList.add('icon-dialog');

                        var selectTemperatureFormat = document.createElement('select');
                        selectTemperatureFormat.classList.add('temperature-format');

                        var optionC = document.createElement('option');
                        optionC.value = 'c';
                        optionC.textContent = String.fromCharCode(8451);

                        var optionF = document.createElement('option');
                        optionF.value = 'f';
                        optionF.textContent = String.fromCharCode(8457);

                        liTemperatureFormat.appendChild(pTemperatureFormat);

                        selectTemperatureFormat.appendChild(optionC);
                        selectTemperatureFormat.appendChild(optionF);
                        spanTemperatureFormat.appendChild(selectTemperatureFormat);
                        liTemperatureFormat.appendChild(spanTemperatureFormat);

                        ul.appendChild(liTemperatureFormat);

                        var liUpdateInterval = document.createElement('li');
                        var pUpdateInterval = document.createElement('p');
                        pUpdateInterval.textContent = 'Update Interval';

                        var spanUpdateInterval = document.createElement('span');
                        spanUpdateInterval.classList.add('button');
                        spanUpdateInterval.classList.add('icon');
                        spanUpdateInterval.classList.add('icon-dialog');

                        var selectUpdateInterval = document.createElement('select');
                        selectUpdateInterval.classList.add('temperature-format');

                        var option5m = document.createElement('option');
                        option5m.value = '5';
                        option5m.textContent = '5 Minutes';

                        var option10m = document.createElement('option');
                        option10m.value = '10';
                        option10m.textContent = '10 Minutes';

                        var option15m = document.createElement('option');
                        option15m.value = '15';
                        option15m.textContent = '15 Minutes';

                        var option30m = document.createElement('option');
                        option30m.value = '30';
                        option30m.textContent = '30 Minutes';

                        var option1h = document.createElement('option');
                        option1h.value = '60';
                        option1h.textContent = '1 Hour';

                        var option12h = document.createElement('option');
                        option12h.value = '720';
                        option12h.textContent = '12 Hours';

                        var option1d = document.createElement('option');
                        option1d.value = '1440';
                        option1d.textContent = '1 Day';

                        liUpdateInterval.appendChild(pUpdateInterval);

                        selectUpdateInterval.appendChild(option5m);
                        selectUpdateInterval.appendChild(option10m);
                        selectUpdateInterval.appendChild(option15m);
                        selectUpdateInterval.appendChild(option30m);
                        selectUpdateInterval.appendChild(option1h);
                        selectUpdateInterval.appendChild(option12h);
                        selectUpdateInterval.appendChild(option1d);
                        spanUpdateInterval.appendChild(selectUpdateInterval);
                        liUpdateInterval.appendChild(spanUpdateInterval);

                        ul.appendChild(liUpdateInterval);

                        customSettings.appendChild(ul);

                        var addonDetailsBody = mutation.target.querySelector('.addon-details-body');
                        var filterHeader = addonDetailsBody.querySelector('header');

                        addonDetailsBody.insertBefore(customSettings, filterHeader);

                        selectTemperatureFormat.addEventListener('change', function() {
                            settings.createLock().set({
                                'statusbar-temperature.degree-format': selectTemperatureFormat.value
                            });
                        });

                        // Get current degree format
                        var reqTemperatureFormat = settings.createLock().get('statusbar-temperature.degree-format');

                        reqTemperatureFormat.onsuccess = function() {
                            var deg = reqTemperatureFormat.result['statusbar-temperature.degree-format'];
                            selectTemperatureFormat.value = deg;
                        };

                        reqTemperatureFormat.onerror = function() {
                            // Can not get degree format from settings
                            settings.createLock().set({
                                'statusbar-temperature.degree-format': 'c'
                            });
                            selectTemperatureFormat.value = 'c';
                        };

                        selectUpdateInterval.addEventListener('change', function() {
                            settings.createLock().set({
                                'statusbar-temperature.update-interval': parseInt(selectUpdateInterval.value, 10)
                            });
                        });

                        // Get current update interval
                        var reqUpdateInterval = settings.createLock().get('statusbar-temperature.update-interval');

                        reqUpdateInterval.onsuccess = function() {
                            var interval = reqUpdateInterval.result['statusbar-temperature.update-interval'];
                            selectUpdateInterval.value = interval;
                        };

                        reqUpdateInterval.onerror = function() {
                            // Can not get update interval from settings
                            settings.createLock().set({
                                'statusbar-temperature.update-interval': 10
                            });
                            selectUpdateInterval.value = 10;
                        };
                    }
                }
            });
        });

        var waitForAddonDetails = setInterval(function() {
            // Get the addon details page
            var detailsEl = document.getElementById('addon-details');

            if (!detailsEl) {
                return;
            }

            clearInterval(waitForAddonDetails);

            observer.observe(detailsEl, {
                attributes: true
            });

        }, 500);

    }

}());
