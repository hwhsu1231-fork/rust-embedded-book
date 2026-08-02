(() => {
    const fullPath = window.location.pathname;

    // Resolve site root by walking up until versions.json is found.
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

    resolveSiteRoot().then((result) => {
        if (!result) return;
        createVersionSwitcher(result.data, result.siteRoot);
    }).catch((err) => console.warn("Could not load versions.json:", err));

    function createVersionSwitcher(data, siteRoot) {
        // Parse URL:  /<langtag>/<version>/<pagePath>
        // e.g.         /zh-tw      /stable  /some/page.html
        const afterSite = fullPath.substring(siteRoot.length);
        const parts = afterSite.split("/").filter(Boolean);
        // parts = ["zh-tw", "stable", "some", "page.html"]

        let langtag = "";
        let currentVersion = data.latest;
        let pagePath = "/";

        if (parts.length >= 2) {
            langtag = parts[0];              // "zh-tw"
            currentVersion = parts[1];       // "stable"
            pagePath = "/" + parts.slice(2).join("/"); // "/some/page.html"
        } else if (parts.length === 1) {
            // Might be just /<langtag>/  — no version segment
            langtag = parts[0];
            pagePath = "/";
        }

        // Build the set of known version names
        const knownVersions = new Set(data.versions.map((v) => v.version));
        if (!knownVersions.has(currentVersion)) {
            currentVersion = data.latest;
        }

        // Create dropdown
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

        // Insert into menu bar (to the right of language switcher)
        const menuBar = document.querySelector(".right-buttons");
        if (menuBar) {
            menuBar.insertBefore(container, menuBar.firstChild);
        }

        // Handle version change — swap version, keep langtag + pagePath
        document.getElementById("version-select").addEventListener("change", (e) => {
            const newVersion = e.target.value;
            const newPath = siteRoot + "/" + langtag + "/" + newVersion + pagePath;
            window.location.href = newPath;
        });
    }
})();
