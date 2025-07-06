import definePlugin, { OptionType } from "@utils/types";
import { definePluginSettings } from "@api/Settings";

const settings = definePluginSettings({
    hiddenItems: {
        type: OptionType.STRING,
        description: 'Names of buttons to hide (separate multiple names with commas, e.g. "Nitro, Shop")',
        default: "Nitro"
    }
});

function parseHiddenNames(): string[] {
    return settings.store.hiddenItems
        .split(/[, ]+/)
        .map(name => name.trim())
        .filter(Boolean);
}

function hideSidebarItems() {
    const namesToHide = parseHiddenNames();

    document.querySelectorAll(".channel__972a0.container_e45859").forEach((el) => {
        const nameEl = el.querySelector(".name__20a53");
        const name = nameEl?.textContent?.trim();
        if (name && namesToHide.includes(name)) {
            el.style.display = "none";
        }
    });
}

let observer: MutationObserver | null = null;

export default definePlugin({
    name: "HideSidebarButton",
    description: "Hide sidebar buttons by exact name from setting input.",
    authors: [{ name: "otteobi", id: 524980170554212363n }],
    settings,

    start() {
        const namesToHide = parseHiddenNames();
        if (!namesToHide.length) return;

        hideSidebarItems();

        observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if ([...m.addedNodes].some(n =>
                    n instanceof HTMLElement && n.classList.contains("channel__972a0")
                )) {
                    requestAnimationFrame(hideSidebarItems);
                    break;
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    stop() {
        observer?.disconnect();
        observer = null;
    }
});
