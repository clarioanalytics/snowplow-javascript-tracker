;(function() {
    window.snowplow("newTracker", "cf", window.clarioTrackerData.collector || "c.clario.us", {
        appId: window.clarioTrackerData.app_id,
        platform: "web",
        discoverRootDomain: true,
        post: true,
        contexts: {
            webPage: true,
            performanceTiming: true,
            gaCookies: true,
            geolocation: false
        }
    });

    window.snowplow('setUserId', window.clarioTrackerData.customer_id);

    (function() {
        var hits = [];
        var allTheCookies = document.cookie.split(";");
        ["_fbp", "_ga"].forEach(function(term) {
            var found = allTheCookies.find(function(cookie) {
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
    })();


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
            window.clarioTrackerData.order_items.forEach(function(item) {
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
    };

    if (window.clarioTrackerData.gumEnabled) {
        try {
            var gumUrl = "https://gum.criteo.com/sync?c=" + window.ClarioTrackerData.gum_id + "&r=1&a=1&u=";

            var redirectUrl =
                "https://" +
                window.clarioTrackerData.collector +
                "/i?aid=" +
                window.clarioTrackerData.app_id +
                "&e=se&p=web&tv=2.10.2&se_ca=criteo&se_ac=cookie_match&se_la=" +
                // domainUserId
                (""+document.cookie.split(";").find(function(cookie){return cookie.search(/_sp_id\..*=/) >= 0;})).split("=")[1].split(".")[0] +
                "&se_pr=@USERID@";

            var xhr = new XMLHttpRequest();
            xhr.open('GET', gumUrl + encodeURIComponent(redirectUrl),true);
            xhr.withCredentials = true;
            xhr.send();
        } catch {
            console.log("Error sending GUM request.")
        }
    }
}());
