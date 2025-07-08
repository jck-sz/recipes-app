import { Component, OnInit } from '@angular/core';
import { RecipeService } from './recipe.service';

@Component({
  selector: 'my-app',
  template: `
    <h1>Recipes</h1>
    <ul>
      <li *ngFor="let recipe of recipes">
        {{ recipe.title }}
      </li>
    </ul>
  `
})
export class AppComponent implements OnInit {
  recipes: any[] = [];

  constructor(private recipeService: RecipeService) {}

  ngOnInit() {
    this.recipeService.getRecipes().subscribe((res: any) => {
      this.recipes = res.data;
    });
  }
}
