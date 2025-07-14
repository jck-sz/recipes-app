import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private apiBaseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getRecipes(): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/recipes`).pipe(
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
          map((recipesWithIngredients) => {
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
    return this.http.get(`${this.apiBaseUrl}/recipes/${recipeId}/ingredients`);
  }

  getIngredients(): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/ingredients?limit=100`);
  }
}
