import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../services/recipe.service';
import { CategoryService } from '../../services/category.service';
import { ErrorHandlerService } from '../../services/error-handler.service';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.css']
})
export class RecipesComponent implements OnInit {
  recipes: any[] = [];
  categories: any[] = [];
  groupedRecipes: { [key: string]: any[] } = {};
  loading = true;
  error = '';

  categoryEmojis: { [key: string]: string } = {
    'Śniadanie': '🌅',
    'Obiad': '🍽️',
    'Kolacja': '🌙',
    'Przekąska': '🍪'
  };

  constructor(
    private recipeService: RecipeService,
    private categoryService: CategoryService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit() {
    console.log('RecipesComponent ngOnInit called');
    this.loadData();
  }

  loadData() {
    // Load both recipes and categories
    this.recipeService.getRecipes().subscribe({
      next: (recipesRes: any) => {
        console.log('Recipes response:', recipesRes);
        this.recipes = recipesRes?.data || [];

        // Load categories
        this.categoryService.getCategories().subscribe({
          next: (categoriesRes: any) => {
            console.log('Categories response:', categoriesRes);
            this.categories = categoriesRes?.data || [];
            this.groupRecipesByCategory();
            this.loading = false;
          },
          error: (err) => {
            console.error('Categories error:', err);
            // Still show recipes even if categories fail
            this.groupRecipesByCategory();
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = this.errorHandler.getUserFriendlyErrorMessage(err, 'load recipes');
        this.loading = false;
      }
    });
  }

  groupRecipesByCategory() {
    this.groupedRecipes = {};
    
    // Group recipes by category
    this.recipes.forEach(recipe => {
      const categoryName = recipe.category_name || 'Uncategorized';
      if (!this.groupedRecipes[categoryName]) {
        this.groupedRecipes[categoryName] = [];
      }
      this.groupedRecipes[categoryName].push(recipe);
    });
  }

  getCategoryKeys(): string[] {
    return Object.keys(this.groupedRecipes);
  }

  getCategoryEmoji(categoryName: string): string {
    return this.categoryEmojis[categoryName] || '🍴';
  }

  goToIngredients() {
    this.router.navigate(['/ingredients']);
  }

  openAdminPanel() {
    window.open('admin.html', '_blank');
  }

  formatDescription(description: string): string {
    if (!description) return '';

    // Since descriptions are now stored as HTML with <br> tags in the database,
    // we can return them directly for innerHTML binding
    return description;
  }
}
