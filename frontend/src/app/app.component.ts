import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <nav>
      <h1>FODMAP Recipes</h1>
    </nav>
    <div class="container">
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent { }
