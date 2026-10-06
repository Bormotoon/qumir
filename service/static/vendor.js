let markedPromise = null;
let editorPromise = null;

export function loadMarked() {
  markedPromise ||= import('https://cdn.jsdelivr.net/npm/marked@17.0.1/lib/marked.esm.js')
    .then(module => module.marked);
  return markedPromise;
}

function loadEditorAsset(file, style = false) {
  return new Promise((resolve, reject) => {
    const node = document.createElement(style ? 'link' : 'script');
    const assign = url => {
      if (style) {
        node.rel = 'stylesheet';
        node.href = url;
      } else {
        node.src = url;
      }
    };
    node.onload = resolve;
    node.onerror = () => {
      node.onerror = () => reject(new Error('Не удалось загрузить CodeMirror'));
      const files = {
        'codemirror.css': 'lib/codemirror.css',
        'material-darker.css': 'theme/material-darker.css',
        'codemirror.js': 'lib/codemirror.js',
        'comment.js': 'addon/comment/comment.js',
        'matchbrackets.js': 'addon/edit/matchbrackets.js',
        'simple.js': 'addon/mode/simple.js',
      };
      assign('https://unpkg.com/codemirror@5/' + files[file]);
    };
    assign('/vendor/codemirror/' + file);
    document.head.append(node);
  });
}

export function loadCodeMirror() {
  editorPromise ||= (async () => {
    await Promise.all([loadEditorAsset('codemirror.css', true), loadEditorAsset('material-darker.css', true)]);
    await loadEditorAsset('codemirror.js');
    for (const file of ['comment.js', 'matchbrackets.js', 'simple.js']) {
      await loadEditorAsset(file);
    }
  })();
  return editorPromise;
}
