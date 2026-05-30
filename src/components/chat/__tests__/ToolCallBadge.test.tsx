import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { ToolCallBadge, getToolCallLabel } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

const makeTool = (
  toolName: string,
  args: Record<string, unknown>,
  state = "result",
  result: unknown = true
) => ({ toolName, args, state, result });

describe("getToolCallLabel", () => {
  describe("str_replace_editor", () => {
    it("create command shows filename", () => {
      expect(getToolCallLabel(makeTool("str_replace_editor", { command: "create", path: "/src/Button.tsx" }))).toBe("Creating Button.tsx");
    });

    it("str_replace command shows filename", () => {
      expect(getToolCallLabel(makeTool("str_replace_editor", { command: "str_replace", path: "/src/App.tsx" }))).toBe("Editing App.tsx");
    });

    it("insert command shows filename", () => {
      expect(getToolCallLabel(makeTool("str_replace_editor", { command: "insert", path: "/src/utils.ts" }))).toBe("Inserting into utils.ts");
    });

    it("view command shows filename", () => {
      expect(getToolCallLabel(makeTool("str_replace_editor", { command: "view", path: "/src/index.ts" }))).toBe("Reading index.ts");
    });

    it("undo_edit command shows filename", () => {
      expect(getToolCallLabel(makeTool("str_replace_editor", { command: "undo_edit", path: "/src/foo.ts" }))).toBe("Undoing edit in foo.ts");
    });

    it("unknown command falls back to editing", () => {
      expect(getToolCallLabel(makeTool("str_replace_editor", { command: "unknown", path: "/src/foo.ts" }))).toBe("Editing foo.ts");
    });

    it("missing path falls back gracefully", () => {
      expect(getToolCallLabel(makeTool("str_replace_editor", { command: "create" }))).toBe("Creating file");
    });
  });

  describe("file_manager", () => {
    it("rename command shows old and new name", () => {
      expect(getToolCallLabel(makeTool("file_manager", { command: "rename", path: "/src/old.tsx", new_path: "/src/new.tsx" }))).toBe("Renaming old.tsx to new.tsx");
    });

    it("delete command shows filename", () => {
      expect(getToolCallLabel(makeTool("file_manager", { command: "delete", path: "/src/dead.tsx" }))).toBe("Deleting dead.tsx");
    });

    it("unknown command falls back", () => {
      expect(getToolCallLabel(makeTool("file_manager", { command: "unknown" }))).toBe("Managing file");
    });
  });

  it("unknown tool name returns tool name as-is", () => {
    expect(getToolCallLabel(makeTool("some_other_tool", {}))).toBe("some_other_tool");
  });
});

describe("ToolCallBadge", () => {
  it("shows spinner when not done", () => {
    render(<ToolCallBadge tool={{ toolName: "str_replace_editor", args: { command: "create", path: "/src/Button.tsx" }, state: "call", result: undefined }} />);
    expect(screen.getByText("Creating Button.tsx")).toBeTruthy();
    expect(document.querySelector(".animate-spin")).toBeTruthy();
    expect(document.querySelector(".bg-emerald-500")).toBeNull();
  });

  it("shows green dot when done", () => {
    render(<ToolCallBadge tool={makeTool("str_replace_editor", { command: "create", path: "/src/Button.tsx" })} />);
    expect(screen.getByText("Creating Button.tsx")).toBeTruthy();
    expect(document.querySelector(".bg-emerald-500")).toBeTruthy();
    expect(document.querySelector(".animate-spin")).toBeNull();
  });

  it("shows edit label for str_replace", () => {
    render(<ToolCallBadge tool={makeTool("str_replace_editor", { command: "str_replace", path: "/src/App.tsx" })} />);
    expect(screen.getByText("Editing App.tsx")).toBeTruthy();
  });

  it("shows delete label for file_manager delete", () => {
    render(<ToolCallBadge tool={makeTool("file_manager", { command: "delete", path: "/src/old.tsx" })} />);
    expect(screen.getByText("Deleting old.tsx")).toBeTruthy();
  });
});
