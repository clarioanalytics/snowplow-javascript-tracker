;(function() {
    window.snowplow("newTracker", "cf", window.clarioTrackerData.collector || "c.clario.us", {
        appId: window.clarioTrackerData.app_id,
        platform: "web",
        discoverRootDomain: true,
        stateStorageStrategy: "localStorage",
        post: true,
        contexts: {
            webPage: true,
            performanceTiming: true,
            gaCookies: true,
            geolocation: false
        }
    });

    // Array.find polyfill for IE
    if (!Array.prototype.find) {
        Object.defineProperty(Array.prototype, 'find', {
            value: function(predicate) {
                // 1. Let O be ? ToObject(this value).
                if (this == null) {
                    throw TypeError('"this" is null or not defined');
                }

                var o = Object(this);

                // 2. Let len be ? ToLength(? Get(O, "length")).
                var len = o.length >>> 0;

                // 3. If IsCallable(predicate) is false, throw a TypeError exception.
                if (typeof predicate !== 'function') {
                    throw TypeError('predicate must be a function');
                }

                // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
                var thisArg = arguments[1];

                // 5. Let k be 0.
                var k = 0;

                // 6. Repeat, while k < len
                while (k < len) {
                    // a. Let Pk be ! ToString(k).
                    // b. Let kValue be ? Get(O, Pk).
                    // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                    // d. If testResult is true, return kValue.
                    var kValue = o[k];
                    if (predicate.call(thisArg, kValue, k, o)) {
                        return kValue;
                    }
                    // e. Increase k by 1.
                    k++;
                }

                // 7. Return undefined.
                return undefined;
            },
            configurable: true,
            writable: true
        });
    }

    var trackIt = function () {
        window.snowplow('setUserId', window.clarioTrackerData.customer_id);

        var hits = [];
        var allTheCookies = document.cookie.split(";");
        ["_fbp", "_ga"].forEach(function (term) {
            var found = allTheCookies.find(function (cookie) {
                return cookie.indexOf(term + "=") >= 0;
            });
            if (found) {
                var parts = found.split("=");
                if (parts.length == 2) {
                    hits.push({
                        name: term,
                        value: parts[1]
                    });
                }
            }
        });

        if (hits.length) {
            window.snowplow('trackPageView', null, [{
                schema: "iglu:io.clar/cookies/jsonschema/2-0-0",
                data: {
                    cookies: hits
                }
            }]);
        } else {
            window.snowplow('trackPageView');
        }
    };

    var orderUp = function () {
        if (window.clarioTrackerData.order_id) {
            var context = null;
            if (window.clarioTrackerData.order_context) {
                context = [{
                    schema: "iglu:io.clar/transaction/jsonschema/1-0-0",
                    data: {
                        transaction: window.clarioTrackerData.order_context
                    }
                }]
            }
            window.snowplow('addTrans',
                window.clarioTrackerData.order_id,
                window.clarioTrackerData.order_affiliation,
                window.clarioTrackerData.order_total,
                window.clarioTrackerData.order_tax || "",
                window.clarioTrackerData.order_shipping || "",
                "",
                "",
                "",
                "",
                context
            );

            if (window.clarioTrackerData.order_items) {
                window.clarioTrackerData.order_items.forEach(function (item) {
                    window.snowplow('addItem',
                        item.orderId,
                        item.sku,
                        item.name,
                        "",
                        item.price,
                        item.quantity,
                        "",
                        item.context || ""
                    );
                });
            }

            window.snowplow('trackTrans');
        }
    };

    var chewGum = function () {
        if (window.clarioTrackerData.gum_id) {
            try {

                var collector = window.clarioTrackerData.collector || "c.clario.us";
                var gumUrl = "https://gum.criteo.com/sync?c=" + window.clarioTrackerData.gum_id + "&r=1&a=1&u=";

                Object.keys(localStorage).forEach(function (key) {
                    if (key.search(/_sp_id\.\w/) >= 0) {
                        window.clarioTrackerData.sp_id = localStorage.getItem(key);
                    }
                });

                if (!window.clarioTrackerData.sp_id) {
                    var found = document.cookie.split(";").find(function (cookie) {
                        return cookie.search(/_sp_id\..*=/) >= 0;
                    });

                    if (found) {
                        window.clarioTrackerData.sp_id = found.split("=")[1].split(".")[0];
                    }
                }

                var redirectUrl =
                    "https://" +
                    collector +
                    "/i?aid=" +
                    window.clarioTrackerData.app_id +
                    "&e=se&p=web&tv=2.10.2&se_ca=criteo&se_ac=cookie_match&se_la=" +
                    window.clarioTrackerData.sp_id || "" +
                    "&se_pr=@USERID@";

                var xhr = new XMLHttpRequest();
                xhr.open('GET', gumUrl + encodeURIComponent(redirectUrl), true);
                xhr.withCredentials = true;
                xhr.send();
            } catch {
                console.log("Error sending GUM request.")
            }
        }
    };

    trackIt();
    orderUp();
    chewGum();

    if (window.history) {
        window.history.pushState = function (pushFn) {
            return function pushState() {
                var ret = pushFn.apply(this, arguments);
                window.dispatchEvent(new Event("ClarioLocationChange"));
                return ret
            }
        }(window.history.pushState);

        window.history.replaceState = function (replaceFn) {
            return function replaceState() {
                var ret = replaceFn.apply(this, arguments);
                window.dispatchEvent(new Event("ClarioLocationChange"));
                return ret
            }
        }(window.history.replaceState);

        // capture forward/backward navigation
        window.addEventListener("popstate", function () {
            window.dispatchEvent(new Event("ClarioLocationChange"))
        });

        window.addEventListener('ClarioLocationChange', function () {
            trackIt();
            orderUp();
            chewGum();
        })
    }
} ());
