import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/recipes/recipes.component').then(m => m.RecipesComponent)
  },
  {
    path: 'ingredients',
    loadComponent: () => import('./components/ingredients/ingredients.component').then(m => m.IngredientsComponent)
  },
  { path: '**', redirectTo: '' }
];
