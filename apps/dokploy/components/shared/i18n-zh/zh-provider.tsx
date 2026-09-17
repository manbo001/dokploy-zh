"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ZH_DICT, ZH_WORDS } from "./dict";

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

// 小写索引：支持大小写不敏感匹配（Delete / delete / DELETE）
const LOWER_MAP = new Map<string, string>();
for (const [k, v] of Object.entries(ZH_DICT)) {
	const lk = k.toLowerCase();
	if (!LOWER_MAP.has(lk)) LOWER_MAP.set(lk, v);
}

// 词级词典（小写索引）
const WORDS_LOWER = new Map<string, string>();
for (const [k, v] of Object.entries(ZH_WORDS)) {
	WORDS_LOWER.set(k.toLowerCase(), v);
}

/** 精确 / 大小写不敏感匹配 */
function core(text: string): string | null {
	if (!text) return null;
	const direct = ZH_DICT[text];
	if (direct) return direct;
	const lower = LOWER_MAP.get(text.toLowerCase());
	return lower ?? null;
}

/** 词级组合翻译： "Add Domain" -> "添加域名" */
function composeWords(phrase: string): string | null {
	const parts = phrase.split(/\s+/).filter(Boolean);
	if (parts.length < 2 || parts.length > 4) return null;
	const out: string[] = [];
	for (const p of parts) {
		const clean = p.replace(/[^\w]/g, "").toLowerCase();
		if (!clean) return null;
		const w = WORDS_LOWER.get(clean);
		if (!w) return null;
		out.push(w);
	}
	return out.join("");
}

/** 取值：精确 -> 词级组合 -> 原样 */
function t(s: string): string {
	if (!s) return s;
	return core(s) ?? composeWords(s.trim()) ?? s;
}

/**
 * 句式规则：一条规则可覆盖几十条同类文案
 * 例： "X is required" -> "X为必填项"
 */
const RULES: Array<[RegExp, (m: RegExpMatchArray) => string | null]> = [
	// —— 尽量具体的句式放前面 ——
	[/^You are not allowed to (.+)$/i, (m) => `您无权${t(m[1])}`],
	[/^You are not authorized to (.+)$/i, (m) => `您无权${t(m[1])}`],
	[/^You cannot (.+)$/i, (m) => `您不能${t(m[1])}`],
	[/^You must (.+)$/i, (m) => `您必须${t(m[1])}`],
	[/^Only the (.+?) can (.+)$/i, (m) => `只有${t(m[1])}可以${t(m[2])}`],
	[/^Not authorized to (.+)$/i, (m) => `无权${t(m[1])}`],
	[/^Cannot (.+)$/i, (m) => `无法${t(m[1])}`],
	[/^(.+) not found or you do not have permission to (.+)$/i, (m) => `未找到${t(m[1])}，或您无权${t(m[2])}`],
	[/^(.+) not found or you don't have access$/i, (m) => `未找到${t(m[1])}，或您无权访问`],
	[/^(.+) is required for (.+)$/i, (m) => `${t(m[1])}在 ${t(m[2])} 中为必填项`],
	[/^(.+) must be at least (.+)$/i, (m) => `${t(m[1])}至少为 ${m[2]}`],
	[/^(.+) must be at most (.+)$/i, (m) => `${t(m[1])}不能超过 ${m[2]}`],
	[/^(.+) must be a number between (.+) and (.+)$/i, (m) => `${t(m[1])}必须是 ${m[2]} 到 ${m[3]} 之间的数字`],
	[/^(.+) must start with (.+)$/i, (m) => `${t(m[1])}必须以 ${t(m[2])} 开头`],
	[/^(.+) is disabled for this (.+)$/i, (m) => `此${t(m[2])}已禁用${t(m[1])}`],
	[/^This feature is only available in (.+)$/i, (m) => `此功能仅在 ${t(m[1])} 中可用`],
	[/^This feature is only available for (.+)$/i, (m) => `此功能仅 ${t(m[1])} 可用`],
	[/^Only the (.+)$/i, (m) => `仅限${t(m[1])}`],
	// —— 通用句式 ——
	[/^(.+) is required\.?$/i, (m) => `${t(m[1])}为必填项`],
	[/^(.+) are required\.?$/i, (m) => `${t(m[1])}为必填项`],
	[/^(.+) (?:is|are) not found\.?$/i, (m) => `未找到${t(m[1])}`],
	[/^No (.+) found\.?$/i, (m) => `未找到${t(m[1])}`],
	[/^No (.+)\.?$/i, (m) => `没有${t(m[1])}`],
	[/^Failed to (.+)$/i, (m) => `${t(m[1])}失败`],
	[/^Could not (.+)$/i, (m) => `无法${t(m[1])}`],
	[/^Unable to (.+)$/i, (m) => `无法${t(m[1])}`],
	[/^Error: (.+)$/i, (m) => `错误：${t(m[1])}`],
	[/^Error (.+)$/i, (m) => `${t(m[1])}出错`],
	[/^Loading (.+?)\.{3}$/i, (m) => `正在加载${t(m[1])}...`],
	[/^Search (.+?)\.{3}$/i, (m) => `搜索${t(m[1])}...`],
	[/^Filter (.+?)\.{3}$/i, (m) => `筛选${t(m[1])}...`],
	[/^(.+) successfully\.?$/i, (m) => `${t(m[1])}成功`],
	[/^(.+) (?:updated|saved) successfully\.?$/i, (m) => `${t(m[1])}已更新`],
	[/^Select (?:a|an) (.+)$/i, (m) => `选择${t(m[1])}`],
	[/^Enter (.+)$/i, (m) => `输入${t(m[1])}`],
	[/^Enter a valid (.+)$/i, (m) => `请输入有效的${t(m[1])}`],
	[/^You are not a member of (.+)$/i, (m) => `您不是${t(m[1])}的成员`],
	[/^You don't have any (.+)$/i, (m) => `您还没有任何${t(m[1])}`],
	[/^You don't have (.+)$/i, (m) => `您没有${t(m[1])}`],
	[/^You need to (.+)$/i, (m) => `您需要${t(m[1])}`],
	[/^Please (.+)$/i, (m) => `请${t(m[1])}`],
	[/^Are you sure you want to (.+)\?$/i, (m) => `确定要${t(m[1])}吗？`],
	[/^Do you want to (.+)\?$/i, (m) => `是否要${t(m[1])}？`],
	[/^Delete (.+)\?$/i, (m) => `删除${t(m[1])}？`],
	[/^(.+) is invalid\.?$/i, (m) => `${t(m[1])}无效`],
	[/^Invalid (.+)\.?$/i, (m) => `${t(m[1])}无效`],
	[/^(.+) cannot be empty\.?$/i, (m) => `${t(m[1])}不能为空`],
	[/^(.+) \(Optional\)$/i, (m) => `${t(m[1])}（可选）`],
	[/^(.+) \(optional\)$/i, (m) => `${t(m[1])}（可选）`],
	[/^(.+) \(Internet\)$/i, (m) => `${t(m[1])}（公网）`],
	[/^(.+) \(Container\)$/i, (m) => `${t(m[1])}（容器）`],
	[/^Add (.+)$/i, (m) => `添加${t(m[1])}`],
	[/^Create (.+)$/i, (m) => `创建${t(m[1])}`],
	[/^Update (.+)$/i, (m) => `更新${t(m[1])}`],
	[/^Edit (.+)$/i, (m) => `编辑${t(m[1])}`],
	[/^View (.+)$/i, (m) => `查看${t(m[1])}`],
	[/^Remove (.+)$/i, (m) => `移除${t(m[1])}`],
	[/^Delete (.+)$/i, (m) => `删除${t(m[1])}`],
	[/^Manage (.+)$/i, (m) => `管理${t(m[1])}`],
	[/^Configure (.+)$/i, (m) => `配置${t(m[1])}`],
	[/^Test (.+)$/i, (m) => `测试${t(m[1])}`],
	[/^Enable (.+)$/i, (m) => `启用${t(m[1])}`],
	[/^Disable (.+)$/i, (m) => `禁用${t(m[1])}`],
	[/^Generate (.+)$/i, (m) => `生成${t(m[1])}`],
	[/^Restore (.+)$/i, (m) => `恢复${t(m[1])}`],
];

function wrap(original: string, translated: string): string {
	const lead = original.match(/^\s*/)?.[0] ?? "";
	const tail = original.match(/\s*$/)?.[0] ?? "";
	return lead + translated + tail;
}

/** 翻译一段文本；无匹配返回 null */
export function translateText(text: string): string | null {
	const raw = text.trim();
	if (raw.length < 2 || !/[A-Za-z]/.test(raw)) return null;
	if (raw.length > 300) return null;

	// 1) 精确 / 大小写不敏感
	const direct = core(raw);
	if (direct) return wrap(text, direct);

	// 2) 去掉尾部标点后再查
	const stripped = raw.replace(/[.:!?]+$/, "");
	if (stripped !== raw) {
		const d2 = core(stripped);
		if (d2) return wrap(text, d2 + raw.slice(stripped.length));
	}

	// 3) 句式规则
	for (const [re, fn] of RULES) {
		const m = raw.match(re);
		if (!m) continue;
		const r = fn(m);
		if (r && r !== raw) return wrap(text, r);
	}

	// 4) 词级组合
	const composed = composeWords(raw);
	if (composed) return wrap(text, composed);

	return null;
}

const TRANSLATE_ATTRS = ["placeholder", "title", "aria-label", "alt"];

function translateElement(el: Element) {
	for (const attr of TRANSLATE_ATTRS) {
		const v = el.getAttribute(attr);
		if (!v) continue;
		const zh = translateText(v);
		if (zh) el.setAttribute(attr, zh);
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
	// 先收集再改写，保证 walker 有效
	const targets: Text[] = [];
	let cur = walker.nextNode();
	while (cur) {
		if (cur.nodeType === Node.TEXT_NODE) targets.push(cur as Text);
		cur = walker.nextNode();
	}
	for (const node of targets) {
		const zh = translateText(node.nodeValue || "");
		if (zh) node.nodeValue = zh;
	}
}

export function DokployI18nProvider({ children }: { children: React.ReactNode }) {
	const [lang, setLangState] = useState<Lang>("en");

	// 初始语言：已保存的偏好，否则跟随浏览器
	useEffect(() => {
		const saved = window.localStorage.getItem(LANG_KEY);
		if (saved === "zh" || saved === "en") {
			setLangState(saved);
		} else if (navigator.language?.toLowerCase().startsWith("zh")) {
			setLangState("zh");
		}
	}, []);

	// lang === "zh" 时执行翻译
	useEffect(() => {
		if (lang !== "zh") return;

		document.documentElement.setAttribute("lang", "zh-CN");
		translateTree(document.body);

		let scheduled = false;
		const observer = new MutationObserver((mutations) => {
			if (scheduled) return;
			scheduled = true;
			requestAnimationFrame(() => {
				scheduled = false;
				try {
					for (const m of mutations) {
						for (const node of m.addedNodes) {
							translateTree(node);
						}
						if (m.type === "attributes" && m.target.nodeType === 1) {
							translateElement(m.target as Element);
						}
					}
				} catch {
					// 忽略重渲染期间的瞬时 DOM 错误
				}
			});
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: TRANSLATE_ATTRS,
		});

		return () => {
			observer.disconnect();
			document.documentElement.setAttribute("lang", "en");
		};
	}, [lang]);

	const setLang = (next: Lang) => {
		window.localStorage.setItem(LANG_KEY, next);
		// 整页刷新，确保所有组件都在所选语言下重新渲染
		window.location.reload();
	};

	return (
		<I18nContext.Provider value={{ lang, setLang }}>
			{children}
		</I18nContext.Provider>
	);
}
