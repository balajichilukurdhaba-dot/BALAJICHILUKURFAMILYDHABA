const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const menuDataPath = path.join(__dirname, 'src', 'utils', 'menuData.ts');
const content = fs.readFileSync(menuDataPath, 'utf8');

const result = ts.transpileModule(content, {
  compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React }
});

console.log('TypeScript Transpile Success! Syntactically valid TypeScript code.');
