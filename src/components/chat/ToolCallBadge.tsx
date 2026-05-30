"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  state: string;
  result?: unknown;
  args?: Record<string, unknown>;
}

interface ToolCallBadgeProps {
  tool: ToolInvocation;
}

function getFileName(path: unknown): string {
  if (typeof path !== "string") return "";
  return path.split("/").pop() || path;
}

export function getToolCallLabel(tool: ToolInvocation): string {
  const args = tool.args ?? {};

  if (tool.toolName === "str_replace_editor") {
    const command = args.command as string | undefined;
    const path = args.path as string | undefined;
    const name = path ? getFileName(path) : null;

    switch (command) {
      case "create":
        return name ? `Creating ${name}` : "Creating file";
      case "str_replace":
        return name ? `Editing ${name}` : "Editing file";
      case "insert":
        return name ? `Inserting into ${name}` : "Inserting into file";
      case "view":
        return name ? `Reading ${name}` : "Reading file";
      case "undo_edit":
        return name ? `Undoing edit in ${name}` : "Undoing edit";
      default:
        return name ? `Editing ${name}` : "Editing file";
    }
  }

  if (tool.toolName === "file_manager") {
    const command = args.command as string | undefined;
    const path = args.path as string | undefined;
    const newPath = args.new_path as string | undefined;
    const name = path ? getFileName(path) : null;
    const newName = newPath ? getFileName(newPath) : null;

    switch (command) {
      case "rename":
        return name && newName ? `Renaming ${name} to ${newName}` : "Renaming file";
      case "delete":
        return name ? `Deleting ${name}` : "Deleting file";
      default:
        return "Managing file";
    }
  }

  return tool.toolName;
}

export function ToolCallBadge({ tool }: ToolCallBadgeProps) {
  const isDone = tool.state === "result" && tool.result != null;
  const label = getToolCallLabel(tool);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
