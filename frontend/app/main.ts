import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

console.log('Bootstrapping Angular application...');
platformBrowserDynamic().bootstrapModule(AppModule)
  .then(() => console.log('Angular app bootstrapped successfully'))
  .catch(err => console.error('Bootstrap error:', err));
