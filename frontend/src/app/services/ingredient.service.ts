import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IngredientService {
  private apiBaseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getIngredients(): Observable<any> {
    // fetch first 100 ingredients for simplicity
    return this.http.get(`${this.apiBaseUrl}/ingredients?limit=100`);
  }
}
