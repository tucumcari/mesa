#!/usr/bin/env node

import { Feed } from "feed";
// import fs from "fs";
const fs = require('fs').promises;
import { Glob } from "glob";
import { JSDOM } from "jsdom";
import katex from "katex";

while (true) {
    const str = await fs.promises.readFile("/dev/stdin", { encoding: "utf-8" });
    if (str.length == 0) {
        break;
    }
}

const feed = new Feed({
    title: "Tucumcari's Mesa",
    description: "Tucumcari's Mesa",
    id: "https://github.io/tucumcari/mesa/",
    link: "https://github.io/tucumcari/mesa/",
    image: "https://github.io/tucumcari/mesa/favicon.png",
    favicon: "https://github.io/tucumcari/mesa/favicon.png",
    copyright: "Copyright © 2025 Tucum Cari",
    feedLinks: {
        atom: "https://https://github.io/tucumcari/mesa/feed.atom",
        json: "https://github.io/tucumcari/mesa/feed.json",
        rss: "https://github.io/tucumcari/mesa/feed.rss",
    },
    author: {
        name: "Tucum Cari",
        email: "none@none.com",
        link: "https://github.io/tucumcari/mesa/",
    },
});

const files = new Glob("../html/**/*.html", {});
for await (const file of files) {
    if (file.endsWith("toc.html")) {
        continue;
    }

    const source = await fs.promises.readFile(file, { encoding: "utf-8" });
    const dom = new JSDOM(source, {
        runScripts: "outside-only",
    });

    const window = dom.window;
    const { document, Node } = window;

    const ems = [...document.getElementsByTagName("em")];
    for (const em of ems) {
        if (/^fa-/.test(em.textContent)) {
            const icon = document.createElement("i");
            icon.classList.add("fa", em.textContent);
            icon.ariaHidden = "true";
            em.replaceWith(icon);
        } else if (/^time-/.test(em.textContent)) {
            const value = em.textContent.substring(5);
            const time = document.createElement("time");
            time.dateTime = value;
            time.textContent = value;
            em.replaceWith(time);
        }
    }

    const options = {
        strict(errorCode, errorMsg, token) {
            switch (errorCode) {
                case "unknownSymbol":
                    return "ignore";
                default:
                    return "warn";
            }
        },
    };

    const codes = [...document.getElementsByTagName("code")];
    for (const code of codes) {
        if (code.classList.contains("language-math")) {
            const p = document.createElement("p");
            p.innerHTML = katex.renderToString(code.textContent, { displayMode: true, ...options });
            const pre = code.parentNode;
            pre.replaceWith(p);
        } else if (/^\$.*\$$/.test(code.textContent)) {
            const span = document.createElement("span");
            span.innerHTML = katex.renderToString(code.textContent.slice(1, -1), options);
            code.replaceWith(span);
        }
    }

    document.querySelectorAll("script[type=postproc]")
        .forEach(script => {
            window.eval(script.text);
            script.remove();
        });

    document.querySelectorAll("nav.nav-wrapper, nav.nav-wide-wrapper")
        .forEach(nav => nav.remove());

    const searchbar = document.querySelector("input#searchbar");
    searchbar.placeholder = "Search this site ...";

    const path = file.substring(8);
    if (/^\d{4}\//.test(path)) {
        const infobar = document.querySelector(".infobar");
        const url = "https://github.io/tucumcari/mesa/" + path;
        const date = new Date(infobar.querySelector("time").dateTime);
        feed.addItem({
            title: document.title,
            id: url,
            link: url,
            date,
            author: [
                {
                    name: "Tucum Cari",
                    email: "none@none.com",
                    link: "https://github.io/tucumcari/mesa/",
                },
            ],
        });
    }

    const rightButtons = document.querySelector("#menu-bar .right-buttons");

    const feedButton = document.createElement("a");
    feedButton.classList.add("feed-link");
    feedButton.href = "/feed.atom";
    feedButton.title = "Atom feed";
    feedButton.onclick = "foo";
    const feedIcon = document.createElement("i");
    feedIcon.classList.add("fa", "fa-rss");
    feedIcon.ariaHidden = "true";
    feedButton.append(feedIcon);
    rightButtons.prepend(feedButton);

    const sponsorButton = document.createElement("a");
    sponsorButton.classList.add("sponsor");
    sponsorButton.href = "https://github.com/sponsors/tucumcari";
    sponsorButton.title = "Sponsor";
    const sponsorIcon = document.createElement("i");
    sponsorIcon.classList.add("fa", "fa-heart");
    sponsorIcon.ariaHidden = "true";
    sponsorButton.append(sponsorIcon);
    rightButtons.prepend(sponsorButton);

    await fs.promises.writeFile(file, dom.serialize());
}

await fs.promises.writeFile("../html/feed.atom", feed.atom1());
await fs.promises.writeFile("../html/feed.json", feed.json1());
await fs.promises.writeFile("../html/feed.rss", feed.rss2());
