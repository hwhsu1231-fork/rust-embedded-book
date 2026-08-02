(() => {
    const fullPath = window.location.pathname;

    // Walk up from the current page until versions.json is found.
    async function resolveSiteRoot() {
        let candidate = fullPath.replace(/\/[^/]*$/, "");
        for (let i = 0; i < 6; i++) {
            const url = (candidate || "/") + "/versions.json";
            try {
                const resp = await fetch(url);
                if (resp.ok) return { siteRoot: candidate || "/", data: await resp.json() };
            } catch (_) { /* try parent */ }
            const parent = candidate.replace(/\/[^/]*$/, "");
            if (parent === candidate) break;
            candidate = parent || "/";
        }
        return null;
    }

    function whenReady(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    whenReady(() => {
        resolveSiteRoot().then((result) => {
            if (!result) return;
            createVersionSwitcher(result.data, result.siteRoot);
        }).catch((err) => console.warn("Could not load versions.json:", err));
    });

    function createVersionSwitcher(data, siteRoot) {
        const knownVersions = new Set(data.versions.map((v) => v.version));

        // Parse URL:  /<langtag>/<version>/<pagePath>
        const afterSite = fullPath.substring(siteRoot.length);
        const parts = afterSite.split("/").filter(Boolean);

        let langtag = "";
        let currentVersion = data.latest;
        let pagePath = "/";

        if (parts.length >= 2) {
            langtag = parts[0];
            currentVersion = knownVersions.has(parts[1]) ? parts[1] : data.latest;
            pagePath = "/" + parts.slice(2).join("/");
        } else if (parts.length === 1) {
            langtag = parts[0];
        }

        const container = document.createElement("div");
        container.className = "version-switcher";
        container.innerHTML =
            '<label for="version-select">Version:</label>' +
            '<select id="version-select">' +
            data.versions.map((v) =>
                '<option value="' + v.version + '"' +
                (v.version === currentVersion ? ' selected' : '') + '>' +
                v.label +
                '</option>'
            ).join("") +
            '</select>';

        const menuBar = document.querySelector(".right-buttons");
        if (menuBar) {
            menuBar.insertBefore(container, menuBar.firstChild);
        }

        document.getElementById("version-select").addEventListener("change", (e) => {
            const newVersion = e.target.value;
            window.location.href = siteRoot + "/" + langtag + "/" + newVersion + pagePath;
        });
    }
})();


