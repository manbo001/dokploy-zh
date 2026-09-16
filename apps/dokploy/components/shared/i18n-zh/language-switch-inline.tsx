"use client";

import { useDokployLang } from "./zh-provider";

// Compact inline switch for pages without the sidebar (e.g. login/register)
export function LanguageSwitchInline() {
	const { lang, setLang } = useDokployLang();
	return (
		<div className="flex flex-row items-center justify-center gap-1 text-xs text-muted-foreground">
			<button
				type="button"
				onClick={() => setLang("en")}
				className={
					lang === "en"
						? "font-medium text-foreground hover:underline"
						: "hover:underline"
				}
			>
				English
			</button>
			<span>/</span>
			<button
				type="button"
				onClick={() => setLang("zh")}
				className={
					lang === "zh"
						? "font-medium text-foreground hover:underline"
						: "hover:underline"
				}
			>
				简体中文
			</button>
		</div>
	);
}
