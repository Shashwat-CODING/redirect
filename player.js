const AwsIndStreamDomain  = "https://fuhho374key.com";
const AwsIndStreamProxy   = "https://api.allorigins.win/raw?url=" + AwsIndStreamDomain;

(function () {
    let AwsIndStreamPlayerIframe = document.createElement("iframe");
    let AwsIndStreamPlayerContainer = null;
    let initIndStreamPlayer = false;

    const AwsIndStreamIframeParamTr =
        IndStreamPlayerConfigs.tr !== false && IndStreamPlayerConfigs.tr > 0
            ? "?tr=" + parseInt(IndStreamPlayerConfigs.tr)
            : "";

    const AwsIndStreamIframeUrl =
        `${AwsIndStreamProxy}/play/${IndStreamPlayerConfigs.src}${AwsIndStreamIframeParamTr}`;

    // Generate and append iframe
    const genAwsPlayer = () => {
        AwsIndStreamPlayerIframe.setAttribute("src", AwsIndStreamIframeUrl);
        AwsIndStreamPlayerIframe.setAttribute("width", 1);
        AwsIndStreamPlayerIframe.setAttribute("height", 1);
        AwsIndStreamPlayerIframe.setAttribute("frameborder", 0);
        AwsIndStreamPlayerIframe.setAttribute("allowfullscreen", "allowfullscreen");

        AwsIndStreamPlayerContainer =
            typeof IndStreamPlayerConfigs.selector == "string"
                ? document.querySelector(IndStreamPlayerConfigs.selector)
                : document.getElementById(IndStreamPlayerConfigs.id);

        if (AwsIndStreamPlayerContainer != null) {
            if (AwsIndStreamPlayerContainer.querySelector("iframe") == null) {
                AwsIndStreamPlayerContainer.appendChild(AwsIndStreamPlayerIframe);
            }
        } else {
            setTimeout(genAwsPlayer, 100);
        }
    };

    // AJAX check
    const AwsIndStreamAjax = (url, success, error) => {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status == 200) {
                    if (typeof success == "function") success();
                } else {
                    if (typeof error == "function") error();
                }
            }
        };
        xhr.open("GET", url, true);
        xhr.send(null);
    };

    // Button or auto init
    if ("btn" in IndStreamPlayerConfigs && document.querySelector(IndStreamPlayerConfigs.btn) != null) {
        AwsIndStreamAjax(
            AwsIndStreamIframeUrl,
            () => {
                document.querySelector(IndStreamPlayerConfigs.btn).style.display = "block";
                if ("success" in IndStreamPlayerConfigs && typeof IndStreamPlayerConfigs.success == "function") {
                    IndStreamPlayerConfigs.success();
                }
            },
            () => {
                document.querySelector(IndStreamPlayerConfigs.btn).style.display = "none";
                if ("error" in IndStreamPlayerConfigs && typeof IndStreamPlayerConfigs.error == "function") {
                    IndStreamPlayerConfigs.error();
                }
            }
        );

        document.querySelector(IndStreamPlayerConfigs.btn).addEventListener("click", genAwsPlayer);
    } else {
        document.addEventListener("DOMContentLoaded", genAwsPlayer);
    }

    // Listen for messages from iframe
    function listener(event) {
        // Important: origin should be proxy base only
        if (event.origin === "https://api.allorigins.win" && !initIndStreamPlayer) {
            if ("event" in event.data) {
                if (event.data.event === "init") {
                    AwsIndStreamPlayerIframe.width  = IndStreamPlayerConfigs.width;
                    AwsIndStreamPlayerIframe.height = IndStreamPlayerConfigs.height;
                    initIndStreamPlayer = true;
                } else if (event.data.event === "error" && AwsIndStreamPlayerContainer) {
                    AwsIndStreamPlayerContainer.remove();
                }
            }
        }
    }

    if (window.addEventListener) {
        window.addEventListener("message", listener);
    } else {
        window.attachEvent("onmessage", listener);
    }
})();
