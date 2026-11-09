'use strict';

const vscode = require('vscode');
const converter = require('./converter');

const FONT_SIZE_PROPERTY = ['font-size'];

function getEditor(uri) {
  if (vscode.window.activeTextEditor) {
    const active = vscode.window.activeTextEditor;
    if (!uri || active.document.uri.toString() === uri.toString()) return active;
  }

  if (uri) {
    return vscode.window.visibleTextEditors.find(
      (editor) => editor.document.uri.toString() === uri.toString()
    );
  }

  return vscode.window.activeTextEditor;
}

function getOptions() {
  const config = vscode.workspace.getConfiguration('pxRem');
  return {
    rootFontSize: config.get('rootFontSize', 16),
    precision: config.get('precision', 6),
    properties: converter.normalizeProperties(config.get('properties', ['font-size', 'margin', 'padding']))
  };
}

function getDirectionLabel(direction) {
  return direction === 'pxToRem' ? 'PX → REM' : 'REM → PX';
}

function getScopeLabel(mode) {
  if (mode === 'fontSizeLocal') return 'font-size w zaznaczeniu / przy kursorze';
  if (mode === 'fontSizeDocument') return 'font-size w całym dokumencie';
  return 'skonfigurowane właściwości w całym dokumencie';
}

async function convertDocument(direction, mode, uri) {
  const editor = getEditor(uri);
  if (!editor) {
    vscode.window.showWarningMessage('PX / REM: najpierw otwórz dokument tekstowy.');
    return;
  }

  const options = getOptions();
  const properties = mode === 'fontSizeDocument' ? FONT_SIZE_PROPERTY : options.properties;
  if (properties.length === 0) {
    vscode.window.showInformationMessage('PX / REM: lista właściwości w ustawieniu pxRem.properties jest pusta.');
    return;
  }

  const document = editor.document;
  const fullText = document.getText();
  const converted = converter.convertRange(
    fullText,
    direction,
    options,
    { start: 0, end: fullText.length },
    document.languageId,
    properties
  );

  if (converted.count === 0) {
    vscode.window.showInformationMessage(
      `PX / REM: nie znaleziono wartości ${direction === 'pxToRem' ? 'px' : 'rem'} we właściwościach: ${properties.join(', ')}.`
    );
    return;
  }

  const wholeRange = new vscode.Range(document.positionAt(0), document.positionAt(fullText.length));
  const success = await editor.edit((editBuilder) => {
    editBuilder.replace(wholeRange, converted.text);
  });

  if (success) {
    vscode.window.showInformationMessage(
      `PX / REM: ${getDirectionLabel(direction)} — ${getScopeLabel(mode)}: przekonwertowano ${converted.count} ${converted.count === 1 ? 'wartość' : 'wartości'}.`
    );
  }
}

async function convertFontSizeLocal(direction, uri) {
  const editor = getEditor(uri);
  if (!editor) {
    vscode.window.showWarningMessage('PX / REM: najpierw otwórz dokument tekstowy.');
    return;
  }

  const document = editor.document;
  const fullText = document.getText();
  const options = getOptions();
  const selections = editor.selections.filter((selection) => !selection.isEmpty);
  const edits = [];

  if (selections.length > 0) {
    for (const selection of selections) {
      const start = document.offsetAt(selection.start);
      const end = document.offsetAt(selection.end);
      const range = { start: Math.min(start, end), end: Math.max(start, end) };
      const converted = converter.convertRange(
        fullText, direction, options, range, document.languageId, FONT_SIZE_PROPERTY
      );
      for (const match of converted.matches) {
        edits.push({
          start: match.start,
          end: match.end,
          text: converter.convertMatch(match, direction, options.rootFontSize, options.precision)
        });
      }
    }
  } else {
    const cursorOffset = document.offsetAt(editor.selection.active);
    const match = converter.findNearestMatch(
      fullText, direction, cursorOffset, document.languageId, FONT_SIZE_PROPERTY
    );
    if (match) {
      edits.push({
        start: match.start,
        end: match.end,
        text: converter.convertMatch(match, direction, options.rootFontSize, options.precision)
      });
    }
  }

  // Usuwamy duplikaty pochodzące z nakładających się zaznaczeń.
  const uniqueEdits = [...new Map(edits.map((edit) => [`${edit.start}:${edit.end}`, edit])).values()]
    .sort((a, b) => a.start - b.start);

  if (uniqueEdits.length === 0) {
    const scope = selections.length > 0 ? 'zaznaczeniu' : 'wierszu z właściwością font-size';
    vscode.window.showInformationMessage(
      `PX / REM: nie znaleziono jednostek ${direction === 'pxToRem' ? 'px' : 'rem'} w ${scope}. Zaznacz deklarację font-size albo ustaw kursor przy jej wartości.`
    );
    return;
  }

  const success = await editor.edit((editBuilder) => {
    for (const edit of uniqueEdits) {
      editBuilder.replace(
        new vscode.Range(document.positionAt(edit.start), document.positionAt(edit.end)),
        edit.text
      );
    }
  });

  if (success) {
    const scope = selections.length > 0 ? 'w zaznaczeniu' : 'przy kursorze';
    vscode.window.showInformationMessage(
      `PX / REM: ${getDirectionLabel(direction)} — font-size: przekonwertowano ${uniqueEdits.length} ${uniqueEdits.length === 1 ? 'wartość' : 'wartości'} (${scope}).`
    );
  }
}

function activate(context) {
  const commands = [
    vscode.commands.registerCommand('pxRem.convertFontSizeLocalPxToRem', (uri) => convertFontSizeLocal('pxToRem', uri)),
    vscode.commands.registerCommand('pxRem.convertFontSizeLocalRemToPx', (uri) => convertFontSizeLocal('remToPx', uri)),
    vscode.commands.registerCommand('pxRem.convertFontSizeDocumentPxToRem', (uri) => convertDocument('pxToRem', 'fontSizeDocument', uri)),
    vscode.commands.registerCommand('pxRem.convertFontSizeDocumentRemToPx', (uri) => convertDocument('remToPx', 'fontSizeDocument', uri)),
    vscode.commands.registerCommand('pxRem.convertConfiguredPropertiesPxToRem', (uri) => convertDocument('pxToRem', 'configuredProperties', uri)),
    vscode.commands.registerCommand('pxRem.convertConfiguredPropertiesRemToPx', (uri) => convertDocument('remToPx', 'configuredProperties', uri))
  ];

  context.subscriptions.push(...commands);
}

function deactivate() {}

module.exports = { activate, deactivate };
