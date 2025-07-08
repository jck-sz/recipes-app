import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://localhost:3000';

@Injectable()
export class IngredientService {
  constructor(private http: HttpClient) {}

  getIngredients(): Observable<any> {
    // fetch first 100 ingredients for simplicity
    return this.http.get(`${API_BASE_URL}/ingredients?limit=100`);
  }
}
