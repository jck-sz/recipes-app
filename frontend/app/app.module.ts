import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { RecipeService } from './recipe.service';

@NgModule({
  imports: [BrowserModule, HttpClientModule],
  declarations: [AppComponent],
  providers: [RecipeService],
  bootstrap: [AppComponent]
})
export class AppModule { }
