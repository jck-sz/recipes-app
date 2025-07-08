import { Component, OnInit } from '@angular/core';
import { RecipeService } from './recipe.service';

@Component({
  selector: 'my-app',
  template: `
    <h1>Recipes</h1>
    <div *ngIf="loading">Loading recipes...</div>
    <div *ngIf="error" style="color:red;">{{ error }}</div>
    <ul *ngIf="!loading && !error">
      <li *ngFor="let recipe of recipes">
        {{ recipe.title }}
      </li>
    </ul>
    <div *ngIf="!loading && !error && recipes.length === 0">No recipes found.</div>
  `
})
export class AppComponent implements OnInit {
  recipes: any[] = [];
  loading = true;
  error = '';

  constructor(private recipeService: RecipeService) {}

  ngOnInit() {
    this.recipeService.getRecipes().subscribe({
      next: (res: any) => {
        this.recipes = res.data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load recipes';
        this.loading = false;
      }
    });
  }
}
