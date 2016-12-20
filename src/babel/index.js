function load() {
    if ('registerElement' in document
        && 'import' in document.createElement('link')
        && 'content' in document.createElement('template')) {
        console.log('Components are supported!');
        loadApp();
    } else {
        var wbcm = document.createElement('script');
        wbcm.src = '/assets/bower/webcomponentsjs/webcomponents-lite.min.js';
        document.head.appendChild(wbcm);
        wbcm.onload = loadApp();
    }

    function loadApp() {
        console.log('Webcomponents initialized (or native shadowdom supported)!');
        if (location.hostname === "localhost") {
            loadPage()
        } else {
            var app = document.createElement('script');
            app.dataset.cfasync = 'false';
            app.src = '/elements.js';
            document.body.appendChild(app);
            app.onload = loadPage()
        }
    }

    function loadPage() {
        var link = document.querySelector('#app');
        if (link.import && link.import.readyState === 'complete') {
            loadedPage();
        } else {
            link.addEventListener('load', loadedPage);
        }
    }

    function loadedPage() {
        var loadScreen = document.getElementById('splash');
        loadScreen.addEventListener('transitionend', loadScreen.remove);
        document.body.classList.remove('loading');
        loadDeferredStyles();
    };

    function loadDeferredStyles() {
        var gfonts = document.createElement('link');
        var faweso = document.createElement('link');
        gfonts.href = 'https://fonts.googleapis.com/css?family=Quicksand:400,700|Raleway:400,400i,700,700i|Source+Code+Pro:700';
        faweso.href = 'https://use.fontawesome.com/719774c3f8.css';
        gfonts.rel = 'stylesheet';
        faweso.rel = 'stylesheet';
        document.body.appendChild(gfonts);
        document.body.appendChild(faweso);
    };
};

if (document.readyState === 'complete') {
    load();
} else {
    window.onload = load;
}