import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RecipeService } from './recipe.service';

@Component({
  selector: 'recipes-page',
  template: `
    <h1>Recipes</h1>
    <button (click)="goToIngredients()">View Ingredients</button>
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
export class RecipesComponent implements OnInit {
  recipes: any[] = [];
  loading = true;
  error = '';

  constructor(private recipeService: RecipeService, private router: Router) {}

  ngOnInit() {
    console.log('RecipesComponent ngOnInit called');
    this.recipeService.getRecipes().subscribe({
      next: (res: any) => {
        console.log('Recipes response:', res);
        this.recipes = res.data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Recipes error:', err);
        this.error = 'Failed to load recipes: ' + err.message;
        this.loading = false;
      }
    });
  }

  goToIngredients() {
    this.router.navigate(['/ingredients']);
  }
}
