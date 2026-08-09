import monacoPackageJson from "monaco-editor/package.json?raw";

export class MonacoUtils {
  static async init() {
    window.MonacoEnvironment = {
      async getWorker() {
        return new (await import("monaco-editor/esm/vs/language/typescript/ts.worker?worker")).default();
      },
    };
    const [monaco, { shikiToMonaco }, { createHighlighterCore }, { createJavaScriptRegexEngine }] =
      await Promise.all([
        import("monaco-editor"),
        import("@shikijs/monaco"),
        import("shiki/core"),
        import("shiki/engine/javascript"),
      ]);
    // Replace monaco's built-in monarch highlighting with shiki's
    // textmate-grammar highlighting, using the same VS Code themes as
    // kysely.dev.
    const highlighter = await createHighlighterCore({
      themes: [import("shiki/themes/dark-plus.mjs"), import("shiki/themes/light-plus.mjs")],
      langs: [import("shiki/langs/typescript.mjs")],
      engine: createJavaScriptRegexEngine(),
    });
    shikiToMonaco(highlighter, monaco);
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      strict: true,
      noImplicitAny: true,
    });
  }

  static async addLib(filePath: string, value: string) {
    const monaco = await import("monaco-editor");
    monaco.languages.typescript.typescriptDefaults.addExtraLib(value, filePath);
  }

  static async getVersions() {
    const monaco = await import("monaco-editor");

    return {
      typescript: monaco.languages.typescript.typescriptVersion,
      monaco: JSON.parse(monacoPackageJson).version,
    };
  }
}
