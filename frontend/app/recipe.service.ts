import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// API base URL can be adjusted if the backend runs on a different host
const API_BASE_URL = 'http://localhost:3000';

@Injectable()
export class RecipeService {
  constructor(private http: HttpClient) {}

  getRecipes(): Observable<any> {
    return this.http.get(`${API_BASE_URL}/recipes`);
  }
}
