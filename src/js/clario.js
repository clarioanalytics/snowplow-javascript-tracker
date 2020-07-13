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


    function find(items, fn) {
        return items.filter(fn)[0]
    }

    window.snowplow('setUserId', window.clarioTrackerData.customer_id);

    var contexts = [];
    var cookies = [];
    var allTheCookies = document.cookie.split(";");
    ["_fbp", "_ga"].forEach(function (term) {
        var found = find(allTheCookies, function (cookie) {
            return cookie.indexOf(term + "=") >= 0;
        });
        if (found) {
            var parts = found.split("=");
            if (parts.length == 2) {
                cookies.push({
                    name: term,
                    value: parts[1]
                });
            }
        }
    });

    if (cookies.length) {
        contexts.push({
            schema: "iglu:io.clar/cookies/jsonschema/2-0-0",
            data: {
                cookies: cookies
            }
        });
    }

    if (window.clarioTrackerData.page_meta && window.clarioTrackerData.page_meta.length) {
        contexts.push({
            schema: "iglu:io.clar/page_meta/jsonschema/1-0-0",
            data: {
                page_meta: window.clarioTrackerData.page_meta
            }
        });
    }

    if (contexts.length) {
        window.snowplow('trackPageView', null, contexts);
    } else {
        window.snowplow('trackPageView');
    }

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
                var cookieAry = document.cookie.split(";");
                var found = find(cookieAry, function (cookie) {
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
} ());
