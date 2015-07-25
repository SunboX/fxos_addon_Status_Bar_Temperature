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

    // Get the addon details page
    var detailsEl = document.getElementById('addon-details');

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {

        if (mutation.attributeName === 'class' && mutation.target.classList.contains('current')) {
          var addonDetailsHeader = mutation.target.querySelector('.addon-details-header');
          var customSettings = mutation.target.querySelector('.status-bar-temp');

          if (customSettings) {
            customSettings.parentElement.removeChild(customSettings);
            customSettings = null;
          }

          if(addonDetailsHeader.textContent === 'Status Bar - Temperature') {
            
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
            var li = document.createElement('li');
            var p = document.createElement('p');
            p.textContent = 'Temperature Format';
            
            var span = document.createElement('span');
            span.classList.add('button');
            span.classList.add('icon');
            span.classList.add('icon-dialog');
            
            var select = document.createElement('select');
            select.classList.add('temperature-format');
            
            var optionC = document.createElement('option');
            optionC.value = 'c';
            optionC.textContent = String.fromCharCode(8451);
            
            var optionF = document.createElement('option');
            optionF.value = 'f';
            optionF.textContent = String.fromCharCode(8457);

            li.appendChild(p);
            
            select.appendChild(optionC);
            select.appendChild(optionF);
            span.appendChild(select);
            li.appendChild(span);
            
            ul.appendChild(li);
            customSettings.appendChild(ul);

            var addonDetailsBody = mutation.target.querySelector('.addon-details-body');
            var filterHeader = addonDetailsBody.querySelector('header');

            addonDetailsBody.insertBefore(customSettings, filterHeader);
            
            select.addEventListener('change', function () {
              settings.createLock().set({
                'statusbar-temperature.degree-format': select.value
              });
            });

            // Get current degree format
            var req = settings.createLock().get('statusbar-temperature.degree-format');

            req.onsuccess = function bt_EnabledSuccess() {
              var deg = req.result['statusbar-temperature.degree-format'];
              select.value = deg;
            };

            req.onerror = function bt_EnabledOnerror() {
              // Can not get degree format from settings
              settings.createLock().set({
                'statusbar-temperature.degree-format': 'c'
              });
            };
          }
        }
      });
    });

    observer.observe(detailsEl, {
      attributes: true
    });

  }

}());
