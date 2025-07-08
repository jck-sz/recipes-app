(function (global) {
  System.config({
    transpiler: 'ts',
    typescriptOptions: {
      emitDecoratorMetadata: true,
      experimentalDecorators: true
    },
    paths: {
      'npm:': 'https://unpkg.com/'
    },
    map: {
      app: 'app',
      'ts': 'npm:plugin-typescript@8.0.0/lib/plugin.js',
      'typescript': 'npm:typescript@4.5.4/lib/typescript.js',
      '@angular/core': 'npm:@angular/core@12/bundles/core.umd.js',
      '@angular/common': 'npm:@angular/common@12/bundles/common.umd.js',
      '@angular/common/http': 'npm:@angular/common@12/bundles/common-http.umd.js',
      '@angular/compiler': 'npm:@angular/compiler@12/bundles/compiler.umd.js',
      '@angular/platform-browser': 'npm:@angular/platform-browser@12/bundles/platform-browser.umd.js',
      '@angular/platform-browser-dynamic': 'npm:@angular/platform-browser-dynamic@12/bundles/platform-browser-dynamic.umd.js',
      '@angular/router': 'npm:@angular/router@12/bundles/router.umd.js',
      'rxjs': 'npm:rxjs@6.6.7',
      'rxjs/operators': 'npm:rxjs@6.6.7/operators/index.js',
      'tslib': 'npm:tslib@2.3.0/tslib.es6.js'
    },
    packages: {
      app: { main: './main.ts', defaultExtension: 'ts' },
      rxjs: { defaultExtension: 'js' }
    }
  });
})(this);
