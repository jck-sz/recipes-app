import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Category {
  id: number;
  name: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit?: string;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
}

@Injectable()
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<{ data: Category[] }>(`${this.baseUrl}/categories`)
      .pipe(map(res => res.data));
  }

  getRecipesByCategory(id: number): Observable<Recipe[]> {
    return this.http.get<{ data: Recipe[] }>(`${this.baseUrl}/categories/${id}/recipes`)
      .pipe(map(res => res.data));
  }

  getRecipe(id: number): Observable<Recipe> {
    return this.http.get<{ data: Recipe }>(`${this.baseUrl}/recipes/${id}`)
      .pipe(map(res => res.data));
  }
}
