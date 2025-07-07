import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, Recipe } from '../services/api.service';

@Component({
  selector: 'app-recipe-list',
  template: `
    <h2>Recipes</h2>
    <ul class="recipe-list">
      <li *ngFor="let recipe of recipes">
        <a (click)="goToRecipe(recipe.id)">{{ recipe.title }}</a>
      </li>
    </ul>
  `
})
export class RecipeListComponent implements OnInit {
  recipes: Recipe[] = [];

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getRecipesByCategory(id).subscribe(data => this.recipes = data);
  }

  goToRecipe(id: number) {
    this.router.navigate(['/recipe', id]);
  }
}
