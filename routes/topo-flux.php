<?php

use App\Http\Controllers\TopoFluxController;
use Illuminate\Support\Facades\Route;

Route::prefix('topo-flux')
    ->name('topo-flux.')
    ->middleware(['auth'])
    ->group(function () {
    
    Route::get('/', [TopoFluxController::class, 'index'])
        ->name('index');
    
    Route::get('/{entityType}/{id}', [TopoFluxController::class, 'show'])
        ->where('entityType', 'demandeur|propriete')
        ->name('show');
    
    Route::post('/{entityType}/{id}/reject', [TopoFluxController::class, 'reject'])
        ->where('entityType', 'demandeur|propriete')
        ->name('reject');
});