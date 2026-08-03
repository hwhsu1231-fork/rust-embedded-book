(() => {
    const fullPath = window.location.pathname;

    // Derive siteRoot from a langtag segment (e.g. /xx-xx/) in the URL.
    // This avoids CORS errors from walking up past the site root on
    // subdirectory deployments like GitHub Pages.
    function deriveSiteRoot() {
        const m = fullPath.match(/^(.+?)\/([a-z]{2}-[a-z]{2})\//);
        return m ? m[1] : "";
    }

    const siteRoot = deriveSiteRoot();

    function loadLanguages() {
        return fetch(siteRoot + "/languages.json")
            .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
            .catch(() => null);
    }

    function whenReady(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    whenReady(() => {
        loadLanguages().then((data) => {
            if (!data) return;
            createLanguageSwitcher(data, siteRoot);
        });
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
            '<label for="language-select" title="Language">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>' +
            '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' +
            '</svg></label>' +
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



