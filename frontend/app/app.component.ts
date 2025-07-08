import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  template: `
    <div>
      <h1>FODMAP Recipe App</h1>
      <nav>
        <a routerLink="/">Recipes</a> |
        <a routerLink="/ingredients">Ingredients</a>
      </nav>
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent {}
