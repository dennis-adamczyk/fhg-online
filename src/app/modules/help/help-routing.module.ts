import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HelpComponent } from './pages/help/help.component';
import { HelpArticleComponent } from './pages/help/article/article.component';
import { RequestComponent } from './pages/help/request/request.component';
import { PendingChangesGuard } from 'src/app/core/guards/pending-changes.guard';

const routes: Routes = [
  {
    path: '',
    component: HelpComponent,
    data: { title: 'Hilfe & Feedback' }
  },
  {
    path: 'bug',
    component: RequestComponent,
    data: { title: 'Fehler melden', type: 'bug' },
    canDeactivate: [PendingChangesGuard]
  },
  {
    path: 'feedback',
    component: RequestComponent,
    data: { title: 'Feedback senden', type: 'feedback' },
    canDeactivate: [PendingChangesGuard]
  },
  {
    path: 'question',
    component: RequestComponent,
    data: { title: 'Frage einreichen', type: 'question' },
    canDeactivate: [PendingChangesGuard]
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
