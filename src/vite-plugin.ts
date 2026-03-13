import babelPluginDebugLabel from './babel-plugin';

type TransformResult = {
  code: string;
  map: object | null;
};

type ViteCompatiblePlugin = {
  name: string;
  enforce: 'pre';
  transform: (code: string, id: string) => Promise<TransformResult | null>;
};

export function createViteDebugInspectorPlugin(): ViteCompatiblePlugin {
  return {
    name: 'react-debug-inspector-transform',
    enforce: 'pre',
    async transform(code: string, id: string) {
      if (id.includes('node_modules')) return null;
      if (!/\.[jt]sx($|\?)/.test(id)) return null;

      const { transformAsync } = await import('@babel/core');
      const result = await transformAsync(code, {
        filename: id,
        babelrc: false,
        configFile: false,
        plugins: [babelPluginDebugLabel()],
        parserOpts: {
          plugins: ['jsx', 'typescript'],
        },
        sourceMaps: true,
      });

      if (!result?.code) return null;
      return {
        code: result.code,
        map: result.map ?? null,
      };
    },
  };
}
