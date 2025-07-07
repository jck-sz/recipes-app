import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { CategoryListComponent } from './components/category-list.component';
import { RecipeListComponent } from './components/recipe-list.component';
import { RecipeDetailComponent } from './components/recipe-detail.component';
import { ApiService } from './services/api.service';

const routes: Routes = [
  { path: '', component: CategoryListComponent },
  { path: 'category/:id', component: RecipeListComponent },
  { path: 'recipe/:id', component: RecipeDetailComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    CategoryListComponent,
    RecipeListComponent,
    RecipeDetailComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
  ],
  providers: [ApiService],
  bootstrap: [AppComponent]
})
export class AppModule { }
