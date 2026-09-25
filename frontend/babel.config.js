export default {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    function () {
      return {
        visitor: {
          MetaProperty(path) {
            path.replaceWithSourceString('({ env: { VITE_API_URL: process.env.VITE_API_URL || "" } })');
          },
        },
      };
    },
  ],
};
