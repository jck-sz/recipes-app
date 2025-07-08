import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { RecipesComponent } from './recipes.component';
import { IngredientsComponent } from './ingredients.component';
import { RecipeService } from './recipe.service';
import { IngredientService } from './ingredient.service';

const routes: Routes = [
  { path: '', component: RecipesComponent },
  { path: 'ingredients', component: IngredientsComponent }
];

@NgModule({
  imports: [BrowserModule, HttpClientModule, RouterModule.forRoot(routes)],
  declarations: [AppComponent, RecipesComponent, IngredientsComponent],
  providers: [RecipeService, IngredientService],
  bootstrap: [AppComponent]
})
export class AppModule { }
