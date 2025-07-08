import { Component, OnInit } from '@angular/core';
import { IngredientService } from './ingredient.service';

@Component({
  selector: 'ingredients-page',
  template: `
    <h1>Ingredients</h1>
    <div *ngIf="loading">Loading ingredients...</div>
    <div *ngIf="error" style="color:red;">{{ error }}</div>
    <ul *ngIf="!loading && !error">
      <li *ngFor="let ing of ingredients">
        {{ ing.name }} - {{ ing.fodmap_level || 'UNKNOWN' }}
      </li>
    </ul>
    <div *ngIf="!loading && !error && ingredients.length === 0">No ingredients found.</div>
  `
})
export class IngredientsComponent implements OnInit {
  ingredients: any[] = [];
  loading = true;
  error = '';

  constructor(private ingredientService: IngredientService) {}

  ngOnInit() {
    this.ingredientService.getIngredients().subscribe({
      next: (res: any) => {
        this.ingredients = res.data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load ingredients';
        this.loading = false;
      }
    });
  }
}
