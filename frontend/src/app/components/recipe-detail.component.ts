import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService, Recipe } from '../services/api.service';

@Component({
  selector: 'app-recipe-detail',
  template: `
    <div *ngIf="recipe">
      <h2>{{ recipe.title }}</h2>
      <p>{{ recipe.description }}</p>
      <h3>Ingredients</h3>
      <ul>
        <li *ngFor="let ing of recipe.ingredients">
          {{ ing.quantity }} {{ ing.unit }} {{ ing.name }}
        </li>
      </ul>
    </div>
  `
})
export class RecipeDetailComponent implements OnInit {
  recipe?: Recipe;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getRecipe(id).subscribe(data => this.recipe = data);
  }
}
