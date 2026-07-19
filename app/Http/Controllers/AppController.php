<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Response;

class AppController extends Controller
{
  // might wanna move this to dedicated controller like HomeController, instead of using AppController for everything, but for now it's fine
  // so basically delete this controller and move the index method to HomeController, and then change the route to point to HomeController@index instead of AppController@index
  public function index(Request $request): Response
  {
    return inertia('app/home');
  }

  public function profile(): Response
  {
    return inertia('app/user/profile');
  }
}
