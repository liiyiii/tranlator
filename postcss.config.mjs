// postcss.config.mjs

const config = {
  plugins: {
    // **【关键修改】**
    // 之前这里可能是 'tailwindcss'，现在必须是 '@tailwindcss/postcss'
    '@tailwindcss/postcss': {},
    
    // 保持 autoprefixer 以确保浏览器兼容性
    autoprefixer: {},
  },
};

export default config;