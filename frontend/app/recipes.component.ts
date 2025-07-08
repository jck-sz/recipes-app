import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RecipeService } from './recipe.service';

@Component({
  selector: 'recipes-page',
  template: `
    <div class="recipes-container">
      <h1>FODMAP Recipe Collection</h1>
      <button (click)="goToIngredients()" class="nav-button">View Ingredients</button>

      <div *ngIf="loading" class="loading">🍳 Loading delicious recipes...</div>
      <div *ngIf="error" class="error">{{ error }}</div>

      <div *ngIf="!loading && !error && recipes.length === 0" class="no-recipes">
        No recipes found. Use the admin panel to add some recipes!
      </div>

      <div *ngIf="!loading && !error && recipes.length > 0" class="recipes-grid">
        <div *ngFor="let recipe of recipes" class="recipe-card">
          <div class="recipe-title">{{ recipe.title }}</div>

          <div *ngIf="recipe.description" class="recipe-description">
            {{ recipe.description }}
          </div>

          <div class="recipe-meta">
            <span *ngIf="recipe.preparation_time" class="meta-item">
              ⏱️ {{ recipe.preparation_time }} min
            </span>
            <span *ngIf="recipe.serving_size" class="meta-item">
              👥 Serves {{ recipe.serving_size }}
            </span>
            <span *ngIf="recipe.category_name" class="meta-item">
              📂 {{ recipe.category_name }}
            </span>
          </div>

          <div *ngIf="recipe.ingredients && recipe.ingredients.length > 0" class="ingredients-section">
            <div class="ingredients-title">🥘 Ingredients</div>
            <div class="ingredients-list">
              <div *ngFor="let ingredient of recipe.ingredients"
                   class="ingredient-item"
                   [ngClass]="'fodmap-' + (ingredient.fodmap_level || 'unknown').toLowerCase()">
                <span class="ingredient-name">{{ ingredient.name }}</span>
                <div class="ingredient-details">
                  <span class="ingredient-quantity">
                    {{ ingredient.quantity }} {{ ingredient.quantity_unit || 'unit' }}
                  </span>
                  <span class="fodmap-badge"
                        [ngClass]="'fodmap-' + (ingredient.fodmap_level || 'unknown').toLowerCase()">
                    {{ ingredient.fodmap_level || 'UNKNOWN' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="!recipe.ingredients || recipe.ingredients.length === 0" class="no-ingredients">
            No ingredients listed
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recipes-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    h1 {
      color: #2c3e50;
      text-align: center;
      margin-bottom: 2rem;
      font-size: 2.5rem;
      background: linear-gradient(45deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .nav-button {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      margin-bottom: 2rem;
      transition: transform 0.2s ease;
    }

    .nav-button:hover {
      transform: translateY(-2px);
    }

    .loading, .error, .no-recipes {
      text-align: center;
      padding: 2rem;
      font-size: 1.2rem;
    }

    .error {
      color: #dc3545;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
    }

    .recipes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 2rem;
    }

    .recipe-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .recipe-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    }

    .recipe-title {
      font-size: 1.5rem;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 0.75rem;
    }

    .recipe-description {
      color: #6c757d;
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .recipe-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e9ecef;
    }

    .meta-item {
      font-size: 0.9rem;
      color: #495057;
    }

    .ingredients-section {
      margin-top: 1rem;
    }

    .ingredients-title {
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 0.75rem;
      font-size: 1.1rem;
    }

    .ingredients-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .ingredient-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 3px solid transparent;
    }

    .ingredient-name {
      font-weight: 500;
      color: #2c3e50;
    }

    .ingredient-details {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .ingredient-quantity {
      color: #6c757d;
      font-size: 0.9rem;
    }

    .fodmap-badge {
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: bold;
      text-transform: uppercase;
    }

    .fodmap-low {
      border-left-color: #28a745;
    }

    .fodmap-low .fodmap-badge {
      background: #d4edda;
      color: #155724;
    }

    .fodmap-moderate {
      border-left-color: #ffc107;
    }

    .fodmap-moderate .fodmap-badge {
      background: #fff3cd;
      color: #856404;
    }

    .fodmap-high {
      border-left-color: #dc3545;
    }

    .fodmap-high .fodmap-badge {
      background: #f8d7da;
      color: #721c24;
    }

    .fodmap-unknown {
      border-left-color: #6c757d;
    }

    .fodmap-unknown .fodmap-badge {
      background: #e2e3e5;
      color: #495057;
    }

    .no-ingredients {
      color: #6c757d;
      font-style: italic;
      text-align: center;
      padding: 1rem;
    }
  `]
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
        console.log('First recipe ingredients:', res.data?.[0]?.ingredients);
        this.recipes = res.data || [];
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
