import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IngredientService } from '../../services/ingredient.service';

@Component({
  selector: 'app-ingredients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ingredients.component.html',
  styleUrls: ['./ingredients.component.css']
})
export class IngredientsComponent implements OnInit {
  ingredients: any[] = [];
  loading = true;
  error = '';

  constructor(
    private ingredientService: IngredientService,
    private router: Router
  ) {}

  ngOnInit() {
    this.ingredientService.getIngredients().subscribe({
      next: (res: any) => {
        console.log('Ingredients response:', res);
        this.ingredients = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Ingredients error:', err);
        this.error = 'Failed to load ingredients: ' + err.message;
        this.loading = false;
      }
    });
  }

  goToRecipes() {
    this.router.navigate(['/']);
  }

  openAdminPanel() {
    window.open('admin.html', '_blank');
  }
}
