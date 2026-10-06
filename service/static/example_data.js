const IMPORT_PREFIX = 'qumir-doc-import:';
const IMPORT_LIFETIME = 5 * 60 * 1000;

export function exampleData(value) {
  if (!value || typeof value.code !== 'string' || typeof value.stdin !== 'string' || !Array.isArray(value.files)) {
    throw new Error('Неверные данные примера');
  }
  const names = new Set();
  const files = value.files.map(file => {
    if (!file || typeof file.name !== 'string' || !file.name.trim() || typeof file.content !== 'string' || names.has(file.name)) {
      throw new Error('У файлов примера должны быть разные непустые имена');
    }
    names.add(file.name);
    return { name: file.name, content: file.content };
  });
  return { code: value.code, stdin: value.stdin, files };
}

export function readExample(element) {
  if (!element.id || element.querySelector('qumir-example')) {
    throw new Error('Примеру нужен уникальный id; вложенные примеры не поддерживаются');
  }
  const programs = element.querySelectorAll(':scope > pre > code.language-kumir');
  if (programs.length !== 1) {
    throw new Error('В примере нужен один блок кода kumir');
  }
  const inputs = element.querySelectorAll(':scope > qumir-input');
  if (inputs.length > 1) {
    throw new Error('В примере допустим один блок ввода');
  }
  const blockText = node => {
    const blocks = node.querySelectorAll(':scope > pre > code');
    if (blocks.length !== 1) {
      throw new Error('Файл и ввод должны содержать один блок кода');
    }
    return blocks[0].textContent;
  };
  return exampleData({
    code: programs[0].textContent,
    stdin: inputs.length ? blockText(inputs[0]) : '',
    files: Array.from(element.querySelectorAll(':scope > qumir-file'), node => ({
      name: node.getAttribute('name'), content: blockText(node),
    })),
  });
}

function clearExpiredImports() {
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith(IMPORT_PREFIX)) {
      continue;
    }
    try {
      if (JSON.parse(localStorage.getItem(key)).expires > Date.now()) {
        continue;
      }
    } catch {}
    localStorage.removeItem(key);
  }
}

export function openExample(value) {
  clearExpiredImports();
  const id = crypto.randomUUID();
  const key = IMPORT_PREFIX + id;
  localStorage.setItem(key, JSON.stringify({ ...exampleData(value), expires: Date.now() + IMPORT_LIFETIME }));
  try {
    // Opening a blank tab first makes a blocked popup detectable even with no opener.
    const tab = window.open('about:blank', '_blank');
    if (!tab) {
      throw new Error('Разрешите открытие новой вкладки и попробуйте снова');
    }
    tab.opener = null;
    tab.location.replace('/?doc-import=' + encodeURIComponent(id));
  } catch (error) {
    localStorage.removeItem(key);
    throw error;
  }
  setTimeout(() => localStorage.removeItem(key), IMPORT_LIFETIME);
}

export function consumeExample(id) {
  const key = IMPORT_PREFIX + id;
  const raw = localStorage.getItem(key);
  localStorage.removeItem(key);
  clearExpiredImports();
  const value = raw ? JSON.parse(raw) : null;
  if (!value || !(value.expires > Date.now())) {
    throw new Error('Данные примера недоступны. Откройте его из статьи ещё раз');
  }
  return exampleData(value);
}
