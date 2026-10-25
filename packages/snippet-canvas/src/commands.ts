/** Canonical command IDs shared by registration and programmatic execution. */
export const ExtensionCommands = {
  open: "snippetCanvas.open",
  addSelection: "snippetCanvas.addSelection",
  addFile: "snippetCanvas.addFile",
  clear: "snippetCanvas.clear",
  renameSnippet: "snippetCanvas.renameSnippet",
  deleteSnippet: "snippetCanvas.deleteSnippet",
  moveSnippetUp: "snippetCanvas.moveSnippetUp",
  moveSnippetDown: "snippetCanvas.moveSnippetDown",
} as const;

export type ExtensionCommand =
  (typeof ExtensionCommands)[keyof typeof ExtensionCommands];
