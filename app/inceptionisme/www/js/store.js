
// Our application's global object
var app = {};

//
// Constructor
// -----------
//

app.initialize = function() {
    log('initialize');

    // Listen to the deviceready event.
    // Make sure the score of 'this' isn't lost.
    document.addEventListener('deviceready', this.bind(this.onDeviceReady), false);
};

//
// Methods
// -------
//

// deviceready event handler.
//
// will just initialize the Purchase plugin
app.onDeviceReady = function() {
    if (device.platform == "iOS") {
        document.getElementById("iosSpacer").style.display = "block";
    }
        
    log('onDeviceReady');
    shared.updateDreamTokens();
    this.initStore();
};

// initialize the purchase plugin if available
app.initStore = function() {

    if (!window.store) {
        log('Store not available');
        return;
    }

    // Enable maximum logging level
    store.verbosity = store.INFO;

    // Enable remote receipt validation
    //store.validator = "https://api.fovea.cc:1982/check-purchase";

    // Inform the store of your products
    /*
    store.register({
        id:    'buy_20_dreams',
        alias: '20 Dream Tokens',
        type:   store.CONSUMABLE
    });*/

    store.register({
        id:    'buy_50_dreams',
        alias: '50 Dream Tokens',
        type:   store.CONSUMABLE
    });

    store.register({
        id:    'buy_100_dreams',
        alias: '100 Dream Tokens',
        type:  store.CONSUMABLE
    });

    store.register({
        id:    'buy_500_dreams',
        alias: '500 Dream Tokens',
        type:  store.CONSUMABLE
    });

    // When any product gets updated, refresh the HTML.
    store.when("product").updated(function (p) {
        app.renderIAP(p);
    });

    // Log all errors
    store.error(function(error) {
        log('STORE ERROR ' + error.code + ': ' + error.message);
    });

    // When purchase of an extra life is approved,
    // deliver it... by displaying logs in the console.
    store.when("20 Dream Tokens").approved(function (order) {
        log("You got 20 DreamTokens! "+order);

        shared.addDreamTokens(20);

        order.finish();
    });
    store.when("50 Dream Tokens").approved(function (order) {
        log("You got 50 DreamTokens! "+order);

        shared.addDreamTokens(50);

        order.finish();
    });
    store.when("100 Dream Tokens").approved(function (order) {
        log("You got 100 DreamTokens! "+order);

        shared.addDreamTokens(100);

        order.finish();
    });
    store.when("500 Dream Tokens").approved(function (order) {
        log("You got 500 DreamTokens! "+order);

        shared.addDreamTokens(500);

        order.finish();
    });
    store.when("product").approved(function (order) {
        //alert("OLO");
        // tested. works :) in case we need it...
    });

    // When the store is ready (i.e. all products are loaded and in their "final"
    // state), we hide the "loading" indicator.
    //
    // Note that the "ready" function will be called immediately if the store
    // is already ready.
    store.ready(function() {
        var el = document.getElementById("loading-indicator");
        if (el)
            el.style.display = 'none';

        var elprod = document.getElementById("store-products");
        if (elprod)
            elprod.style.display = 'block';        
    });

    // When store is ready, activate the "refresh" button;
    store.ready(function() {
        var el = document.getElementById('refresh-button');
        if (el) {
            el.style.display = 'block';
            el.onclick = function(ev) {
                store.refresh();
            };
        }
    });

    // Refresh the store.
    //
    // This will contact the server to check all registered products
    // validity and ownership status.
    //
    // It's fine to do this only at application startup, as it could be
    // pretty expensive.
    log('refresh');
    store.refresh();
};

app.renderIAP = function(p) {
    console.log("wanna render: "+p.id);
    var elId = p.id; //p.id.split(".")[3];

    var el = document.getElementById(elId + '-purchase');
    if (!el) return;

    if (!p.loaded) {
        el.innerHTML = "<span class='product-title'>...</span>";
    }
    else if (!p.valid) {
        el.innerHTML = "<span class='product-title'>" + p.alias + " is Invalid</span>";
    }
    else if (p.valid) {
        var html = "<span class='product-title'>" + p.alias + "</span>";
        if (p.canPurchase) {
            html += "<span class='btn buy-button' id='buy-" + p.id + "' productId='" + p.id + "' type='button'>" + p.price + "</span>";
        }
        el.innerHTML = html;
        if (p.canPurchase) {
            document.getElementById("buy-" + p.id).onclick = function (event) {
                var pid = this.getAttribute("productId");
                store.order(pid);
            };
        }
    }
};

// 
// Utilities
// ---------
//

// shortcut to the app logging function.
function log(arg) { app.log(arg); }

// log both in the console and in the HTML #log element.
app.log = function(arg) {
    try {
        if (typeof arg !== 'string')
            arg = JSON.stringify(arg);
        console.log(arg);
        document.getElementById('log').innerHTML += '<div>' + arg + '</div>';
    } catch (e) {}
};

// make sure fn will be called with app as 'this'
app.bind = function(fn) {
    return function() {
        fn.call(app, arguments);
    };
};

app.initialize();