(() => {
    const fullPath = window.location.pathname;

    // Derive siteRoot from a langtag segment (e.g. /xx-xx/) in the URL.
    function deriveSiteRoot() {
        const m = fullPath.match(/^(.+?)\/([a-z]{2}-[a-z]{2})\//);
        return m ? m[1] : "";
    }

    const siteRoot = deriveSiteRoot();

    function loadVersions() {
        return fetch(siteRoot + "/versions.json")
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
        loadVersions().then((data) => {
            if (!data) return;
            createVersionSwitcher(data, siteRoot);
        });
    });

    function createVersionSwitcher(data, siteRoot) {
        const knownVersions = new Set(data.versions.map((v) => v.version));

        // Scan URL segments for a known version.  Supports all three layouts:
        //   /<langtag>/<version>/<pagePath>
        //   /<langtag>/<pagePath>            → version not found → skip
        //   /<version>/<pagePath>
        const afterSite = fullPath.substring(siteRoot.length);
        const parts = afterSite.split("/").filter(Boolean);

        let currentVersion = data.latest;
        let versionIdx = -1;
        for (let i = 0; i < parts.length; i++) {
            if (knownVersions.has(parts[i])) {
                versionIdx = i;
                currentVersion = parts[i];
                break;
            }
        }
        if (versionIdx < 0) return;  // no version in URL — nothing to switch

        // Everything before/after the version stays unchanged.
        const prefix   = "/" + parts.slice(0, versionIdx).join("/");
        const pagePath = "/" + parts.slice(versionIdx + 1).join("/");

        const container = document.createElement("div");
        container.className = "version-switcher";
        container.innerHTML =
            '<label for="version-select" title="Version">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>' +
            '<path d="M18 9a9 9 0 0 1-9 9"/>' +
            '</svg></label>' +
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
            window.location.href = siteRoot + prefix + "/" + newVersion + pagePath;
        });
    }
})();


