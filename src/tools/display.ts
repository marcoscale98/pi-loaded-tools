/**
 * Tools display logic — formats and shows loaded tools using Pi's native
 * boot-time visual style (same theme tokens, scope grouping, indentation).
 *
 * Supports compact (collapsed) and expanded views, toggled by ctrl+o.
 */

import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { getAllLoadedTools } from "./api.js";
import type { LoadedTool } from "./types.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface ToolEntry {
  name: string;
  active: boolean;
}

interface ScopeGroup {
  scope: string;
  localTools: ToolEntry[];
  packages: Map<string, ToolEntry[]>;
}

function buildToolGroups(tools: LoadedTool[]): ScopeGroup[] {
  const builtin: ScopeGroup = { scope: "builtin", localTools: [], packages: new Map() };
  const project: ScopeGroup = { scope: "project", localTools: [], packages: new Map() };
  const user: ScopeGroup = { scope: "user", localTools: [], packages: new Map() };
  const path: ScopeGroup = { scope: "path", localTools: [], packages: new Map() };

  for (const tool of tools) {
    let group: ScopeGroup;

    if (tool.source === "builtin") {
      group = builtin;
    } else if (tool.source === "sdk") {
      group = path;
    } else {
      const scope = tool.scope;
      group = scope === "user" ? user : scope === "project" ? project : path;
    }

    const isPackage = tool.origin === "package" && tool.extensionPath;
    if (isPackage) {
      const list = group.packages.get(tool.extensionPath!) ?? [];
      list.push({ name: tool.name, active: tool.active });
      group.packages.set(tool.extensionPath!, list);
    } else {
      group.localTools.push({ name: tool.name, active: tool.active });
    }
  }

  return [builtin, project, user, path].filter(
    (g) => g.localTools.length > 0 || g.packages.size > 0
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the one-line stats summary shown in expanded mode.
 */
function buildStatsLine(tools: LoadedTool[]): string {
  const total = tools.length;
  const active = tools.filter((t) => t.active).length;
  const extCount = tools.filter((t) => t.source === "extension").length;
  const parts = [`${total} tool${total !== 1 ? "s" : ""}`, `${active} active`];
  if (extCount > 0) {
    parts.push(`${extCount} from extension${extCount !== 1 ? "s" : ""}`);
  }
  return parts.join(" · ");
}

/**
 * Format a loaded-tools list using Pi's native boot-time visual style.
 *
 * Compact mode lists names under disabled and enabled headings. Expanded
 * mode retains scope and package grouping within each heading, followed by
 * the overall stats line.
 */
export function formatToolsList(tools: LoadedTool[], theme: Theme, compact = false): string {
  const lines: string[] = [];

  for (const [label, active] of [
    ["Disabled Tools", false],
    ["Enabled Tools", true],
  ] as const) {
    const sectionTools = tools.filter((tool) => tool.active === active);
    lines.push(theme.fg("mdHeading", compact ? `\x1b[1m[${label}]\x1b[22m` : `[${label}]`));

    if (compact) {
      const names = sectionTools.map((tool) => tool.name).sort((a, b) => a.localeCompare(b));
      lines.push(theme.fg("dim", `  ${names.length ? names.join(", ") : "(none)"}`));
      if (!active) lines.push("");
      continue;
    }

    for (const group of buildToolGroups(sectionTools)) {
      lines.push(`  ${theme.fg("accent", group.scope)}`);

      const sorted = [...group.localTools].sort((a, b) => a.name.localeCompare(b.name));
      for (const tool of sorted) {
        lines.push(theme.fg("dim", `    ${tool.active ? "●" : "○"} ${tool.name}`));
      }

      const sortedPkgs = Array.from(group.packages.entries()).sort(([a], [b]) =>
        a.localeCompare(b)
      );
      for (const [source, pkgTools] of sortedPkgs) {
        lines.push(`    ${theme.fg("mdLink", source)}`);
        const sortedPkgTools = [...pkgTools].sort((a, b) => a.name.localeCompare(b.name));
        for (const tool of sortedPkgTools) {
          lines.push(theme.fg("dim", `      ${tool.active ? "●" : "○"} ${tool.name}`));
        }
      }
    }
    if (!active) lines.push("");
  }

  if (!compact) lines.push(theme.fg("dim", `  ${buildStatsLine(tools)}`));
  return lines.join("\n");
}

/**
 * Show loaded tools as a persistent chat message.
 *
 * Uses `pi.sendMessage()` so the tools list appears inline in the chat
 * (same visual position as Pi's native `[Skills]`, `[Extensions]`, etc.)
 * and survives theme changes via the registered message renderer.
 */
export function showTools(pi: ExtensionAPI, _ctx: ExtensionContext): void {
  const tools = getAllLoadedTools(pi.getAllTools(), new Set(pi.getActiveTools()));
  pi.sendMessage({
    customType: "pi-loaded-tools",
    content: `${tools.length} tools (${tools.filter((t) => t.active).length} active)`,
    display: true,
    details: { tools },
  });
}
