(() => {
    // Detect site root and current state from the URL path.
    const fullPath = window.location.pathname;

    // The book is deployed with language subdirectories derived from
    // languages.json langtag values (e.g. /en-us/, /zh-cn/, /zh-tw/).
    // Walk up from the current page until we find languages.json.
    async function resolveSiteRoot() {
        let candidate = fullPath.replace(/\/[^/]*$/, ""); // drop last segment
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

        // Determine current language from path
        let currentLangtag = "";
        for (const lang of languages) {
            const pattern = "/" + lang.langtag;
            if (fullPath.startsWith(siteRoot + pattern)) {
                currentLangtag = lang.langtag;
                break;
            }
        }

        // Compute the page path relative to the language directory
        let pagePath = "/";
        if (currentLangtag) {
            const prefix = siteRoot + "/" + currentLangtag;
            pagePath = fullPath.substring(prefix.length) || "/";
        }

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

        // Handle language change
        document.getElementById("language-select").addEventListener("change", (e) => {
            const newLangtag = e.target.value;
            const newPath = siteRoot + "/" + newLangtag + pagePath;
            window.location.href = newPath;
        });
    }
})();
