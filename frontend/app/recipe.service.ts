import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// API base URL can be adjusted if the backend runs on a different host
const API_BASE_URL = 'http://localhost:3000';

@Injectable()
export class RecipeService {
  constructor(private http: HttpClient) {}

  getRecipes(): Observable<any> {
    return this.http.get(`${API_BASE_URL}/recipes`).pipe(
      switchMap((recipesResponse: any) => {
        if (recipesResponse.error || !recipesResponse.data || recipesResponse.data.length === 0) {
          return [recipesResponse];
        }

        // Get ingredients for all recipes
        const ingredientRequests = recipesResponse.data.map((recipe: any) =>
          this.getRecipeIngredients(recipe.id).pipe(
            map((ingredientsResponse: any) => {
              console.log(`Ingredients for recipe ${recipe.id}:`, ingredientsResponse);
              return {
                ...recipe,
                ingredients: ingredientsResponse.error ? [] : (ingredientsResponse.data?.ingredients || [])
              };
            })
          )
        );

        return forkJoin(ingredientRequests).pipe(
          map((recipesWithIngredients: any[]) => {
            console.log('Recipes with ingredients:', recipesWithIngredients);
            return {
              ...recipesResponse,
              data: recipesWithIngredients
            };
          })
        );
      })
    );
  }

  getRecipeIngredients(recipeId: number): Observable<any> {
    return this.http.get(`${API_BASE_URL}/recipes/${recipeId}/ingredients`);
  }

  getIngredients(): Observable<any> {
    return this.http.get(`${API_BASE_URL}/ingredients?limit=100`);
  }
}
