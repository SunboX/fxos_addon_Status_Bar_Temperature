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

            customSettings = document.createElement('div');
            customSettings.classList.add('status-bar-temp');

            var header = document.createElement('header');
            header.classList.add('status-bar-temp');

            var h2 = document.createElement('h2');
            h2.textContent = 'Settings';

            header.appendChild(h2);
            customSettings.appendChild(header);

            //TODO: Add settings panel

            var ul = document.createElement('ul');
            var li = document.createElement('li');
            var p = document.createElement('p');
            p.classList.add('addon-paragraph');
            p.textContent = 'All Status Bar Temperature Settings will go here.';

            li.appendChild(p);
            ul.appendChild(li);
            customSettings.appendChild(ul);

            var addonDetailsBody = mutation.target.querySelector('.addon-details-body');
            var filterHeader = addonDetailsBody.querySelector('header');

            addonDetailsBody.insertBefore(customSettings, filterHeader);
          }
        }
      });
    });

    observer.observe(detailsEl, {
      attributes: true
    });

  }

}());
