import * as vscode from "vscode";
import { ComposerPanel } from "./composerPanel";
import { DocumentStore } from "./documentStore";
import { ImageExporter } from "./imageExporter";
import { SnippetFeature } from "./snippetFeature";

/**
 * Composes the extension-host services and registers the SnippetCanvas feature.
 * Business logic lives in cohesive modules so activation remains declarative.
 */
export function activate(context: vscode.ExtensionContext) {
  const store = new DocumentStore(context);
  const composer = new ComposerPanel(context, store, new ImageExporter());
  const snippets = new SnippetFeature(store, composer);

  const configurationChanges = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("snippetCanvas")) composer.sync();
  });
  context.subscriptions.push(store, composer, configurationChanges, ...snippets.register());
}

/** VS Code disposes every registered service through `context.subscriptions`. */
export function deactivate() {}
