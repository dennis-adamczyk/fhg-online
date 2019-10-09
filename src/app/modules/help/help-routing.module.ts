import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HelpComponent } from './pages/help/help.component';
import { HelpArticleComponent } from './pages/help/article/article.component';

const routes: Routes = [
  {
    path: '',
    component: HelpComponent,
    data: { title: 'Hilfe & Feedback' }
  },
  {
    path: ':article',
    component: HelpArticleComponent,
    data: { title: 'Hilfe' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HelpRoutingModule {}
