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
            const componentPath = getComponentFunctionPath(path.get('init'));
            if (componentPath) injectAllJSX(componentPath, name, relativePath);
          },
        });
      },
    },
  };

  function getComponentFunctionPath(path: any): any | null {
    if (!path?.node) return null;

    if (path.isArrowFunctionExpression() || path.isFunctionExpression()) {
      return path;
    }

    if (!path.isCallExpression() || !isReactComponentWrapper(path.node.callee)) {
      return null;
    }

    const firstArgument = path.get('arguments.0');
    return getComponentFunctionPath(firstArgument);
  }

  function isReactComponentWrapper(callee: any): boolean {
    if (callee?.type === 'Identifier') {
      return callee.name === 'memo' || callee.name === 'forwardRef';
    }

    return (
      callee?.type === 'MemberExpression' &&
      !callee.computed &&
      callee.object?.type === 'Identifier' &&
      callee.object.name === 'React' &&
      callee.property?.type === 'Identifier' &&
      (callee.property.name === 'memo' || callee.property.name === 'forwardRef')
    );
  }

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
