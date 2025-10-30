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
    },
    {
      src: 'dist/**/*',
      use: '@vercel/static'
    }
  ],
  routes: [
    {
      src: '/api/hello',
      dest: 'api/hello.ts'
    },
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