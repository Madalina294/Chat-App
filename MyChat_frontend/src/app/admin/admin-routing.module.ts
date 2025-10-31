import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AllUsersComponent} from './all-users/all-users.component';
import {AdminDashboardComponent} from './admin-dashboard/admin-dashboard.component';
import { adminGuard } from '../auth/guard/admin.guard';
import {SendEmailComponent} from './send-email/send-email.component';
import {ViewUserAccountComponent} from './view-user-account/view-user-account.component';

const routes: Routes = [
  {path: "", component: AdminDashboardComponent, canActivate: [adminGuard]},
  {path: "dashboard", component: AdminDashboardComponent, canActivate: [adminGuard]},
  {path: "all-users", component: AllUsersComponent, canActivate: [adminGuard]},
  {path: "send-email", component: SendEmailComponent, canActivate: [adminGuard]},
  {path: "view-user-account", component: ViewUserAccountComponent, canActivate: [adminGuard]}
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
