"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ZH_DICT } from "./dict";

type Lang = "en" | "zh";

type I18nContextValue = {
	lang: Lang;
	setLang: (lang: Lang) => void;
};

const I18nContext = createContext<I18nContextValue>({
	lang: "en",
	setLang: () => {},
});

export const useDokployLang = () => useContext(I18nContext);

const LANG_KEY = "DOKPLOY_LANG";
const SKIP_TAGS = new Set([
	"SCRIPT",
	"STYLE",
	"NOSCRIPT",
	"CODE",
	"PRE",
	"TEXTAREA",
	"INPUT",
]);

function translateNodeValue(value: string): string | null {
	const zh = ZH_DICT[value.trim()];
	if (zh && value.trim().length > 0) {
		return value.replace(value.trim(), zh);
	}
	return null;
}

function translateElement(el: Element) {
	// Translate common attributes
	for (const attr of ["placeholder", "title", "aria-label", "alt"]) {
		const v = el.getAttribute(attr);
		if (v) {
			const zh = ZH_DICT[v.trim()];
			if (zh) el.setAttribute(attr, v.replace(v.trim(), zh));
		}
	}
}

function translateTree(root: Node) {
	if (root.nodeType === Node.ELEMENT_NODE) {
		const el = root as Element;
		if (SKIP_TAGS.has(el.tagName)) return;
		translateElement(el);
	}
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
		{
			acceptNode(node) {
				if (node.nodeType === Node.ELEMENT_NODE) {
					const el = node as Element;
					if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
					return NodeFilter.FILTER_SKIP;
				}
				return node.nodeValue && node.nodeValue.trim()
					? NodeFilter.FILTER_ACCEPT
					: NodeFilter.FILTER_SKIP;
			},
		},
	);
	// Collect first, then mutate (walker stays valid)
	const targets: Text[] = [];
	let current = walker.nextNode();
	while (current) {
		if (current.nodeType === Node.TEXT_NODE) targets.push(current as Text);
		current = walker.nextNode();
	}
	for (const t of targets) {
		const zh = translateNodeValue(t.nodeValue || "");
		if (zh) t.nodeValue = zh;
	}
}

function applyChinese(root: Node) {
	translateTree(root);
}

export function DokployI18nProvider({ children }: { children: React.ReactNode }) {
	const [lang, setLangState] = useState<Lang>("en");

	// Initial language: saved preference, else auto-detect from browser
	useEffect(() => {
		const saved = window.localStorage.getItem(LANG_KEY);
		if (saved === "zh" || saved === "en") {
			setLangState(saved);
		} else if (navigator.language?.toLowerCase().startsWith("zh")) {
			setLangState("zh");
		}
	}, []);

	// Apply translation whenever lang === "zh"
	useEffect(() => {
		if (lang !== "zh") return;

		document.documentElement.setAttribute("lang", "zh-CN");
		applyChinese(document.body);

		let scheduled = false;
		const observer = new MutationObserver((mutations) => {
			if (scheduled) return;
			scheduled = true;
			requestAnimationFrame(() => {
				scheduled = false;
				try {
					for (const m of mutations) {
						for (const node of m.addedNodes) {
							applyChinese(node);
						}
						if (m.type === "attributes" && m.target.nodeType === 1) {
							translateElement(m.target as Element);
						}
					}
				} catch {
					// ignore transient DOM errors during re-render
				}
			});
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["placeholder", "title", "aria-label", "alt"],
		});

		return () => {
			observer.disconnect();
			document.documentElement.setAttribute("lang", "en");
		};
	}, [lang]);

	const setLang = (next: Lang) => {
		window.localStorage.setItem(LANG_KEY, next);
		// Full reload guarantees every component re-renders under the chosen language
		window.location.reload();
	};

	return (
		<I18nContext.Provider value={{ lang, setLang }}>
			{children}
		</I18nContext.Provider>
	);
}
