import { Plugin } from "obsidian";
import { MarkdownRenderChild } from "obsidian";

export default class ExamplePlugin extends Plugin {
    async onload() {
        this.registerMarkdownCodeBlockProcessor("with-html", (source, el, ctx) => {
            let rows: string [] = [];
            // split line with \n
            let src = source.replace(/&nbsp;/g, ' ');
            rows = src.split("\n").filter((row) => row.length > 0);
            const div = el.createEl("div", { cls: "code_with_html_block" });
            for (let i = 0; i < rows.length; i++) {
                // find <font color="xx"> tag, and change this line color with it's color attr
                let match = rows[i].match(/<font.*?color="(.*?)">(.*?)<\/font>/);
                if (match) {
                    let str1 = rows[i].substring(0, match.index);
                    let str2 = match[2];
                    let str3 = rows[i].substring(match.index + match[0].length);
                    let cont = div.createEl("div", { cls: "code_with_html_line"});
                    cont.createEl("span", {text: str1 });
                    if (match[1].length != 0) {
                        cont.createEl("span", { cls: "code_with_html_line_tag", text: str2 }).style.color = match[1];
                    } else {
                        cont.createEl("span", { cls: "code_with_html_line_tag", text: str2 });
                    }
                    cont.createEl("span", {text: str3 });
                } else {
                    div.createEl("div", { cls: "code_with_html_line", text: rows[i] });
                }
            }
        });
    }
}