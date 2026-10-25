import * as path from "node:path";
import * as vscode from "vscode";
import { ExtensionCommands } from "./commands";
import { ComposerPanel } from "./composerPanel";
import { DocumentStore, withoutSnippetSettings } from "./documentStore";
import type { CodeSnippet } from "./protocol";

const SNIPPET_VIEW_ID = "snippetCanvas.snippets";
const SNIPPET_CONTEXT = "snippetCanvas.snippet";

/** Registers snippet capture, CRUD, ordering, and Activity Bar presentation. */
export class SnippetFeature {
  constructor(
    private readonly store: DocumentStore,
    private readonly composer: ComposerPanel,
  ) {}

  /** Creates every command and view registration owned by the snippet feature. */
  register(): vscode.Disposable[] {
    const tree = new SnippetTreeProvider(this.store);
    return [
      vscode.window.registerTreeDataProvider(SNIPPET_VIEW_ID, tree),
      vscode.commands.registerCommand(ExtensionCommands.open, () =>
        this.composer.open(),
      ),
      vscode.commands.registerCommand(ExtensionCommands.addSelection, () =>
        this.addSelection(),
      ),
      vscode.commands.registerCommand(ExtensionCommands.addFile, () =>
        this.addFile(),
      ),
      vscode.commands.registerCommand(ExtensionCommands.clear, () =>
        this.clear(),
      ),
      vscode.commands.registerCommand(
        ExtensionCommands.renameSnippet,
        (item: SnippetTreeItem) => this.rename(item.snippet),
      ),
      vscode.commands.registerCommand(
        ExtensionCommands.deleteSnippet,
        (item: SnippetTreeItem) => this.delete(item.snippet),
      ),
      vscode.commands.registerCommand(
        ExtensionCommands.moveSnippetUp,
        (item: SnippetTreeItem) => this.move(item.snippet, -1),
      ),
      vscode.commands.registerCommand(
        ExtensionCommands.moveSnippetDown,
        (item: SnippetTreeItem) => this.move(item.snippet, 1),
      ),
    ];
  }

  private async addSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
      void vscode.window.showInformationMessage(
        "Select code before adding it to SnippetCanvas.",
      );
      return;
    }
    await this.capture(editor, editor.selection);
  }

  private async addFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      void vscode.window.showInformationMessage(
        "Open a file before adding it to SnippetCanvas.",
      );
      return;
    }
    const lastLine = Math.max(0, editor.document.lineCount - 1);
    await this.capture(
      editor,
      new vscode.Range(
        new vscode.Position(0, 0),
        new vscode.Position(
          lastLine,
          editor.document.lineAt(lastLine).text.length,
        ),
      ),
    );
  }

  /** Captures a range or refreshes the existing canonical source location. */
  private async capture(editor: vscode.TextEditor, range: vscode.Range) {
    const document = editor.document;
    const captured: CodeSnippet = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fileName: path.basename(document.fileName) || "Untitled",
      filePath: vscode.workspace.asRelativePath(document.uri, false),
      sourceUri: document.uri.toString(),
      language: document.languageId,
      code: document.getText(range),
      startLine: range.start.line + 1,
      endLine: range.end.line + 1,
      startCharacter: range.start.character,
      endCharacter: range.end.character,
      createdAt: Date.now(),
    };
    const state = this.store.read();
    const existingIndex = state.snippets.findIndex((snippet) =>
      sameSourceRange(snippet, captured),
    );

    if (existingIndex >= 0) {
      const snippets = [...state.snippets];
      snippets[existingIndex] = {
        ...snippets[existingIndex],
        code: captured.code,
        language: captured.language,
        startCharacter: captured.startCharacter,
        endCharacter: captured.endCharacter,
      };
      await this.store.write({ ...state, snippets });
      this.composer.open();
      this.composer.sync();
      void vscode.window.showInformationMessage(
        "SnippetCanvas refreshed the existing snippet at this location.",
      );
      return;
    }

    await this.store.write({
      ...state,
      snippets: [...state.snippets, captured],
    });
    this.composer.open();
    this.composer.post({ type: "snippetAdded", payload: captured });
  }

  private async clear() {
    const answer = await vscode.window.showWarningMessage(
      "Clear every SnippetCanvas snippet?",
      { modal: true },
      "Clear",
    );
    if (answer !== "Clear") return;
    await this.store.update((document) => ({
      ...document,
      snippets: [],
      columnSettings: {},
    }));
    this.composer.post({ type: "cleared" });
  }

  private async rename(snippet: CodeSnippet) {
    const value = await vscode.window.showInputBox({
      title: "Rename Snippet",
      prompt: "Name shown in the SnippetCanvas sidebar",
      value:
        snippet.title ??
        `${snippet.fileName} · lines ${snippet.startLine}–${snippet.endLine}`,
      validateInput: (input) => (input.trim() ? undefined : "Enter a name"),
    });
    if (!value) return;
    await this.store.update((document) => ({
      ...document,
      snippets: document.snippets.map((candidate) =>
        candidate.id === snippet.id
          ? { ...candidate, title: value.trim() }
          : candidate,
      ),
    }));
    this.composer.sync();
  }

  private async delete(snippet: CodeSnippet) {
    const answer = await vscode.window.showWarningMessage(
      `Delete “${snippet.title ?? snippet.fileName}”?`,
      { modal: true },
      "Delete",
    );
    if (answer !== "Delete") return;
    await this.store.update((document) => ({
      ...document,
      snippets: document.snippets.filter(
        (candidate) => candidate.id !== snippet.id,
      ),
      columnSettings: withoutSnippetSettings(
        document.columnSettings,
        snippet.id,
      ),
    }));
    this.composer.sync();
  }

  private async move(snippet: CodeSnippet, direction: -1 | 1) {
    await this.store.update((document) => {
      const snippets = [...document.snippets];
      const from = snippets.findIndex((candidate) => candidate.id === snippet.id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= snippets.length) return document;
      [snippets[from], snippets[to]] = [snippets[to], snippets[from]];
      return { ...document, snippets };
    });
    this.composer.sync();
  }
}

function sameSourceRange(left: CodeSnippet, right: CodeSnippet) {
  return left.sourceUri === right.sourceUri &&
    left.startLine === right.startLine &&
    left.startCharacter === right.startCharacter &&
    left.endLine === right.endLine &&
    left.endCharacter === right.endCharacter;
}

class SnippetTreeProvider implements vscode.TreeDataProvider<SnippetTreeItem> {
  readonly onDidChangeTreeData: vscode.Event<void>;

  constructor(private readonly store: DocumentStore) {
    this.onDidChangeTreeData = store.onDidChange;
  }

  getTreeItem(item: SnippetTreeItem) {
    return item;
  }

  getChildren() {
    const snippets = this.store.read().snippets;
    return snippets.map(
      (snippet, index) => new SnippetTreeItem(snippet, index, snippets.length),
    );
  }
}

class SnippetTreeItem extends vscode.TreeItem {
  constructor(
    readonly snippet: CodeSnippet,
    index: number,
    total: number,
  ) {
    super(
      snippet.title ??
        `${snippet.fileName} · ${snippet.startLine}–${snippet.endLine}`,
      vscode.TreeItemCollapsibleState.None,
    );
    this.description = snippet.language;
    this.tooltip = new vscode.MarkdownString(
      `**${snippet.title ?? snippet.fileName}**\n\n${snippet.filePath}\n\nLines ${snippet.startLine}–${snippet.endLine}`,
    );
    this.iconPath = new vscode.ThemeIcon("symbol-snippet");
    this.contextValue = SNIPPET_CONTEXT;
    this.command = { command: ExtensionCommands.open, title: "Open Composer" };
    this.accessibilityInformation = {
      label: `${this.label}, item ${index + 1} of ${total}`,
    };
  }
}
