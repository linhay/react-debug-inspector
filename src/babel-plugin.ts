export default function babelPluginDebugLabel() {
  return {
    visitor: {
      Program(programPath: any, state: any) {
        const filename = state.file.opts.filename || state.filename || '';
        const cwd = state.cwd || (typeof process !== 'undefined' ? process.cwd() : '');

        // 获取相对路径
        const getRelativePath = (absolutePath: string) => {
          if (!absolutePath) return 'unknown';
          // 移除 cwd 前缀，得到相对路径
          if (absolutePath.startsWith(cwd)) {
            return absolutePath.slice(cwd.length + 1);
          }
          return absolutePath;
        };

        const relativePath = getRelativePath(filename);

        programPath.traverse({
          FunctionDeclaration(path: any) {
            const name = path.node.id?.name;
            if (!name || name[0] !== name[0].toUpperCase()) return;
            injectAllJSX(path, name, relativePath);
          },
          VariableDeclarator(path: any) {
            const name = path.node.id?.name;
            if (!name || name[0] !== name[0].toUpperCase()) return;
            const init = path.node.init;
            if (
              init &&
              (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')
            ) {
              injectAllJSX(path.get('init'), name, relativePath);
            }
          },
        });
      },
    },
  };

  function injectAllJSX(path: any, componentName: string, filePath: string) {
    path.traverse({
      JSXElement(jsxPath: any) {
        const { openingElement } = jsxPath.node;
        const tagName = getTagName(openingElement.name);
        const line = openingElement.loc?.start.line || '0';
        const debugId = `${filePath}:${componentName}:${tagName}:${line}`;

        // 防止重复注入
        const alreadyHas = openingElement.attributes.some(
          (attr: any) => attr.type === 'JSXAttribute' && attr.name?.name === 'data-debug',
        );
        if (alreadyHas) return;

        openingElement.attributes.push({
          type: 'JSXAttribute',
          name: { type: 'JSXIdentifier', name: 'data-debug' },
          value: { type: 'StringLiteral', value: debugId },
        });
      },
    });
  }

  function getTagName(node: any): string {
    if (node.type === 'JSXIdentifier') return node.name;
    if (node.type === 'JSXMemberExpression') {
      return `${getTagName(node.object)}.${node.property.name}`;
    }
    return 'unknown';
  }
}
