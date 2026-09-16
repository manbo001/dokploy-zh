"use client";

import { LanguagesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDokployLang } from "./zh-provider";

export function LanguageToggle() {
	const { lang, setLang } = useDokployLang();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="w-full justify-start gap-2">
					<LanguagesIcon className="size-4" />
					<span>中文 / English</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" side="right">
				<DropdownMenuItem
					className={lang === "en" ? "bg-muted" : ""}
					onClick={() => setLang("en")}
				>
					English (Official)
				</DropdownMenuItem>
				<DropdownMenuItem
					className={lang === "zh" ? "bg-muted" : ""}
					onClick={() => setLang("zh")}
				>
					简体中文
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
