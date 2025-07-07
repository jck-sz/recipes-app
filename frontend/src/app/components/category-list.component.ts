import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, Category } from '../services/api.service';

@Component({
  selector: 'app-category-list',
  template: `
    <h2>Categories</h2>
    <ul class="category-list">
      <li *ngFor="let category of categories">
        <a (click)="goToCategory(category.id)">{{ category.name }}</a>
      </li>
    </ul>
  `
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.getCategories().subscribe(data => this.categories = data);
  }

  goToCategory(id: number) {
    this.router.navigate(['/category', id]);
  }
}
