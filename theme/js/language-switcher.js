(() => {
    const fullPath = window.location.pathname;

    // Walk up from the current page until languages.json is found.
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
            createLanguageSwitcher(result.data, result.siteRoot);
        }).catch((err) => console.warn("Could not load languages.json:", err));
    });

    function createLanguageSwitcher(data, siteRoot) {
        const languages = data.languages;
        const knownLangtags = new Set(languages.map((l) => l.langtag));

        // Scan URL segments for a known langtag.  Supports all three layouts:
        //   /<langtag>/<version>/<pagePath>
        //   /<langtag>/<pagePath>
        //   /<version>/<pagePath>            → langtag not found → skip
        const afterSite = fullPath.substring(siteRoot.length);
        const parts = afterSite.split("/").filter(Boolean);

        let currentLangtag = "";
        let langtagIdx = -1;
        for (let i = 0; i < parts.length; i++) {
            if (knownLangtags.has(parts[i])) {
                langtagIdx = i;
                currentLangtag = parts[i];
                break;
            }
        }
        if (langtagIdx < 0) return;   // no langtag in URL — nothing to switch

        // Everything after the langtag stays unchanged when switching.
        const tail = "/" + parts.slice(langtagIdx + 1).join("/");

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

        const menuBar = document.querySelector(".right-buttons");
        if (menuBar) {
            menuBar.insertBefore(container, menuBar.firstChild);
        }

        document.getElementById("language-select").addEventListener("change", (e) => {
            window.location.href = siteRoot + "/" + e.target.value + tail;
        });
    }
})();



