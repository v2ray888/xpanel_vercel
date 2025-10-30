module.exports = {
  version: 2,
  builds: [
    {
      src: 'api/index.ts',
      use: '@vercel/node',
      config: {
        includeFiles: [
          'dist/**',
          'functions/**',
          'database/**'
        ]
      }
    }
  ],
  routes: [
    {
      src: '/api/test',
      dest: 'api/test.ts'
    },
    {
      src: '/api/(.*)',
      dest: 'api/index.ts'
    },
    {
      src: '/(.*)',
      dest: 'dist/$1'
    }
  ]
};