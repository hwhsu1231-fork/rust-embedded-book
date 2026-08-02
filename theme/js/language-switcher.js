(() => {
    const fullPath = window.location.pathname;

    // Resolve site root by walking up until languages.json is found.
    async function resolveSiteRoot() {
        let candidate = fullPath.replace(/\/[^/]*$/, "");
        for (let i = 0; i < 6; i++) {
            const url = (candidate || "/") + "/languages.json";
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
        createLanguageSwitcher(result.data, result.siteRoot);
    }).catch((err) => console.warn("Could not load languages.json:", err));

    function createLanguageSwitcher(data, siteRoot) {
        // Build language list from languages.json
        const languages = Object.entries(data).map(([code, info]) => ({
            langtag: info.langtag,
            langname: info.langname
        }));

        // Parse URL:  /<langtag>/<version>/<pagePath>
        const afterSite = fullPath.substring(siteRoot.length);
        const parts = afterSite.split("/").filter(Boolean);

        let currentLangtag = "";
        let version = "";
        let pagePath = "/";

        if (parts.length >= 1) {
            currentLangtag = parts[0];
            version = parts.length >= 2 ? parts[1] : "";
            pagePath = parts.length >= 3
                ? "/" + parts.slice(2).join("/")
                : "/";
        }

        // Validate that currentLangtag is actually a known language
        const knownLangtags = new Set(languages.map((l) => l.langtag));
        if (!knownLangtags.has(currentLangtag)) {
            currentLangtag = "";
        }

        // Build the tail: /version/pagePath  (what stays the same when language changes)
        let tail = "";
        if (version) tail += "/" + version;
        tail += pagePath;

        // Create dropdown
        const container = document.createElement("div");
        container.className = "language-switcher";
        container.innerHTML =
            '<label for="language-select">Language:</label>' +
            '<select id="language-select">' +
            languages.map((lang) =>
                '<option value="' + lang.langtag + '"' +
                (lang.langtag === currentLangtag ? ' selected' : '') + '>' +
                lang.langname +
                '</option>'
            ).join("") +
            '</select>';

        // Insert into menu bar
        const menuBar = document.querySelector(".right-buttons");
        if (menuBar) {
            menuBar.insertBefore(container, menuBar.firstChild);
        }

        // Handle language change — swap langtag, keep version + pagePath
        document.getElementById("language-select").addEventListener("change", (e) => {
            const newLangtag = e.target.value;
            const newPath = siteRoot + "/" + newLangtag + tail;
            window.location.href = newPath;
        });
    }
})();

